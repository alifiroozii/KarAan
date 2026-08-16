import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, businessMembers } from "@/db/schema/employers";
import { overtimeRequests } from "@/db/schema/overtime";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/modules/auth/auth.service";
import { expireOvertimeRequest } from "./overtime-expiration";

export class OvertimeManagementQueryService {
  private async assertCanManageAssignment(
    assignmentId: string,
    actorUserId: string,
    actorRole: UserRole
  ) {
    const [row] = await db
      .select({
        assignment: shiftAssignments,
        shift: shifts,
      })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (actorRole === "ADMIN" || actorRole === "SUPER_ADMIN") return row;
    if (row.shift.employerId === actorUserId) return row;

    if (row.shift.branchId) {
      const [managed] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(
            eq(branches.id, row.shift.branchId),
            eq(branches.managerUserId, actorUserId)
          )
        )
        .limit(1);
      if (managed) return row;
    }

    if (row.shift.businessId) {
      const [member] = await db
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, row.shift.businessId),
            eq(businessMembers.userId, actorUserId)
          )
        )
        .limit(1);
      if (member) return row;
    }

    throw new AppError("دسترسی مدیریت اضافه‌کاری این نیرو را ندارید.", "FORBIDDEN", 403);
  }

  async listForManager(
    assignmentId: string,
    actorUserId: string,
    actorRole: UserRole
  ) {
    const row = await this.assertCanManageAssignment(
      assignmentId,
      actorUserId,
      actorRole
    );

    const pending = await db
      .select({ id: overtimeRequests.id, expiresAt: overtimeRequests.expiresAt })
      .from(overtimeRequests)
      .where(
        and(
          eq(overtimeRequests.assignmentId, assignmentId),
          eq(overtimeRequests.status, "PENDING")
        )
      );

    const now = new Date();
    for (const item of pending) {
      if (item.expiresAt <= now) await expireOvertimeRequest(item.id);
    }

    const items = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.assignmentId, assignmentId))
      .orderBy(desc(overtimeRequests.createdAt));

    return {
      assignmentId,
      state: row.assignment.state,
      scheduledEndAt: row.shift.endAt,
      effectiveEndAt: row.assignment.effectiveEndAt ?? row.shift.endAt,
      items: items.map((item) => ({
        ...item,
        fixedBonusRials: item.fixedBonusRials.toString(),
      })),
    };
  }
}
