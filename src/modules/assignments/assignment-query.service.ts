import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { backfillRequests } from "@/db/schema/backfill";
import { branches, businessMembers } from "@/db/schema/employers";
import { noShowEvents } from "@/db/schema/reliability";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { users } from "@/db/schema/users";
import { getAssignmentEta } from "@/infrastructure/redis/redis-client";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/modules/auth/auth.service";

const ACTIVE_WORKER_STATES = [
  "ACCEPTED",
  "RECONFIRM_PENDING",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "CHECKED_IN",
  "ON_BREAK",
] as const;

function calculateNoShowFinalizesAt(input: {
  status: string | null;
  shiftStartAt: Date;
  finalThresholdMinutes: number | null;
}) {
  if (input.status !== "POTENTIAL" || input.finalThresholdMinutes == null) return null;
  return new Date(
    input.shiftStartAt.getTime() + input.finalThresholdMinutes * 60_000
  ).toISOString();
}

export class AssignmentQueryService {
  async getCurrentWorkerAssignment(workerUserId: string) {
    const rows = await db
      .select({
        assignmentId: shiftAssignments.id,
        state: shiftAssignments.state,
        checkedInAt: shiftAssignments.checkedInAt,
        checkedOutAt: shiftAssignments.checkedOutAt,
        effectiveEndAt: shiftAssignments.effectiveEndAt,
        totalBreakMinutes: shiftAssignments.totalBreakMinutes,
        agreedBonusRials: shiftAssignments.agreedBonusRials,
        shiftId: shifts.id,
        branchId: shifts.branchId,
        title: shifts.title,
        locationName: shifts.locationName,
        latitude: shifts.latitude,
        longitude: shifts.longitude,
        geofenceRadiusMeters: shifts.geofenceRadiusMeters,
        startAt: shifts.startAt,
        endAt: shifts.endAt,
        hourlyPayRials: shifts.hourlyPayRials,
        noShowStatus: noShowEvents.status,
        noShowDetectedAt: noShowEvents.detectedAt,
        noShowFinalThresholdMinutes: noShowEvents.finalThresholdMinutes,
      })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .leftJoin(noShowEvents, eq(noShowEvents.assignmentId, shiftAssignments.id))
      .where(
        and(
          eq(shiftAssignments.workerId, workerUserId),
          inArray(shiftAssignments.state, [...ACTIVE_WORKER_STATES])
        )
      )
      .orderBy(asc(shifts.startAt))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];
    const eta = row.state === "EN_ROUTE" ? await getAssignmentEta(row.assignmentId) : null;

    return {
      ...row,
      effectiveEndAt: row.effectiveEndAt ?? row.endAt,
      hourlyPayRials: row.hourlyPayRials.toString(),
      agreedBonusRials: row.agreedBonusRials.toString(),
      eta,
      noShowFinalizesAt: calculateNoShowFinalizesAt({
        status: row.noShowStatus,
        shiftStartAt: row.startAt,
        finalThresholdMinutes: row.noShowFinalThresholdMinutes,
      }),
    };
  }

  private async assertEmployerShiftAccess(
    shiftId: string,
    userId: string,
    role: UserRole
  ): Promise<void> {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return;

    const [shift] = await db
      .select({
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
      })
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (!shift) throw new AppError("شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (shift.employerId === userId) return;

    if (shift.branchId) {
      const [managedBranch] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, shift.branchId), eq(branches.managerUserId, userId)))
        .limit(1);
      if (managedBranch) return;
    }

    if (shift.businessId) {
      const [member] = await db
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, shift.businessId),
            eq(businessMembers.userId, userId)
          )
        )
        .limit(1);
      if (member) return;
    }

    throw new AppError("شما به این شیفت دسترسی ندارید.", "FORBIDDEN", 403);
  }

  async getEmployerShiftAssignments(shiftId: string, userId: string, role: UserRole) {
    await this.assertEmployerShiftAccess(shiftId, userId, role);

    const rows = await db
      .select({
        assignmentId: shiftAssignments.id,
        state: shiftAssignments.state,
        workerId: shiftAssignments.workerId,
        workerName: users.fullName,
        workerAvatarUrl: users.avatarUrl,
        checkedInAt: shiftAssignments.checkedInAt,
        checkedOutAt: shiftAssignments.checkedOutAt,
        effectiveEndAt: shiftAssignments.effectiveEndAt,
        scheduledEndAt: shifts.endAt,
        shiftStartAt: shifts.startAt,
        noShowStatus: noShowEvents.status,
        noShowDetectedAt: noShowEvents.detectedAt,
        noShowFinalThresholdMinutes: noShowEvents.finalThresholdMinutes,
        backfillRequestId: backfillRequests.id,
        backfillStatus: backfillRequests.status,
        backfillTrigger: backfillRequests.trigger,
        backfillUrgentBonusRials: backfillRequests.urgentBonusRials,
        backfillOffersCreated: backfillRequests.offersCreated,
        backfillDispatchAttemptCount: backfillRequests.dispatchAttemptCount,
      })
      .from(shiftAssignments)
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .leftJoin(noShowEvents, eq(noShowEvents.assignmentId, shiftAssignments.id))
      .leftJoin(
        backfillRequests,
        eq(backfillRequests.sourceAssignmentId, shiftAssignments.id)
      )
      .where(eq(shiftAssignments.shiftId, shiftId));

    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        effectiveEndAt: row.effectiveEndAt ?? row.scheduledEndAt,
        backfillUrgentBonusRials: (row.backfillUrgentBonusRials ?? 0n).toString(),
        eta: row.state === "EN_ROUTE" ? await getAssignmentEta(row.assignmentId) : null,
        noShowFinalizesAt: calculateNoShowFinalizesAt({
          status: row.noShowStatus,
          shiftStartAt: row.shiftStartAt,
          finalThresholdMinutes: row.noShowFinalThresholdMinutes,
        }),
      }))
    );
  }
}
