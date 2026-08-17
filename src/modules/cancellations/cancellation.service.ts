import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { branches, businessMembers } from "@/db/schema/employers";
import { cancellations } from "@/db/schema/reliability";
import { shiftAssignments, shifts, shiftSlots } from "@/db/schema/shifts";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";
import type { UserRole } from "@/modules/auth/auth.service";
import {
  assertCancellationReason,
  calculateScheduledPayRials,
  DEFAULT_EMPLOYER_CANCELLATION_POLICY,
  DEFAULT_WORKER_CANCELLATION_POLICY,
  evaluateCancellationPolicy,
  normalizeCancellationPolicy,
  type CancellationPolicy,
  type CancellationSide,
} from "./cancellation-policy";

interface AssignmentContext {
  assignment: typeof shiftAssignments.$inferSelect;
  shift: typeof shifts.$inferSelect;
}

export interface CancellationPreview {
  assignmentId: string;
  side: CancellationSide;
  targetState: "CANCELLED_BY_WORKER" | "CANCELLED_BY_EMPLOYER";
  hoursBeforeStart: number;
  minutesBeforeStart: number;
  isLate: boolean;
  scheduledPayRials: string;
  penaltyRials: string;
  workerCompensationRials: string;
  scoreImpact: number;
  monetarySettlementDeferred: true;
}

export class CancellationService {
  private async loadAssignment(assignmentId: string): Promise<AssignmentContext> {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  private async canManageShift(
    shift: AssignmentContext["shift"],
    actorUserId: string,
    role: UserRole
  ): Promise<boolean> {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
    if (shift.employerId === actorUserId) return true;

    if (shift.branchId) {
      const [managedBranch] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(eq(branches.id, shift.branchId), eq(branches.managerUserId, actorUserId))
        )
        .limit(1);
      if (managedBranch) return true;
    }

    if (shift.businessId) {
      const [member] = await db
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, shift.businessId),
            eq(businessMembers.userId, actorUserId)
          )
        )
        .limit(1);
      if (member) return true;
    }

    return false;
  }

  private async resolveSide(
    row: AssignmentContext,
    actorUserId: string,
    actorRole: UserRole
  ): Promise<CancellationSide> {
    if (row.assignment.workerId === actorUserId) return "WORKER";
    if (await this.canManageShift(row.shift, actorUserId, actorRole)) return "EMPLOYER";
    throw new AppError("اجازه لغو این Assignment را ندارید.", "FORBIDDEN", 403);
  }

  private async loadPolicy(side: CancellationSide): Promise<CancellationPolicy> {
    const key =
      side === "WORKER" ? "cancellation.worker_policy" : "cancellation.employer_policy";
    const fallback =
      side === "WORKER"
        ? DEFAULT_WORKER_CANCELLATION_POLICY
        : DEFAULT_EMPLOYER_CANCELLATION_POLICY;
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return normalizeCancellationPolicy(setting?.value, fallback);
  }

  private async buildPreview(
    row: AssignmentContext,
    side: CancellationSide,
    now: Date
  ): Promise<CancellationPreview & { policy: CancellationPolicy; policyTier: unknown }> {
    const targetState =
      side === "WORKER" ? "CANCELLED_BY_WORKER" : "CANCELLED_BY_EMPLOYER";
    if (!AssignmentStateMachine.canTransition(row.assignment.state, targetState)) {
      throw new AppError(
        "این Assignment در وضعیت فعلی قابل لغو نیست.",
        "CANCELLATION_NOT_ALLOWED",
        409,
        { state: row.assignment.state, targetState }
      );
    }

    const policy = await this.loadPolicy(side);
    const scheduledPayRials = calculateScheduledPayRials({
      startAt: row.shift.startAt,
      endAt: row.shift.endAt,
      hourlyPayRials: row.shift.hourlyPayRials,
    });
    const evaluation = evaluateCancellationPolicy({
      now,
      shiftStartAt: row.shift.startAt,
      scheduledPayRials,
      policy,
    });

    return {
      assignmentId: row.assignment.id,
      side,
      targetState,
      hoursBeforeStart: evaluation.hoursBeforeStart,
      minutesBeforeStart: evaluation.minutesBeforeStart,
      isLate: evaluation.isLate,
      scheduledPayRials: scheduledPayRials.toString(),
      penaltyRials: evaluation.penaltyRials.toString(),
      workerCompensationRials: evaluation.workerCompensationRials.toString(),
      scoreImpact: evaluation.scoreImpact,
      monetarySettlementDeferred: true,
      policy,
      policyTier: evaluation.tier,
    };
  }

  async preview(
    assignmentId: string,
    actorUserId: string,
    actorRole: UserRole
  ): Promise<CancellationPreview> {
    const row = await this.loadAssignment(assignmentId);
    const side = await this.resolveSide(row, actorUserId, actorRole);
    const preview = await this.buildPreview(row, side, new Date());
    const { policy: _policy, policyTier: _policyTier, ...publicPreview } = preview;
    return publicPreview;
  }

  async cancel(input: {
    assignmentId: string;
    actorUserId: string;
    actorRole: UserRole;
    reasonCode: string;
    description?: string;
  }) {
    const row = await this.loadAssignment(input.assignmentId);
    const side = await this.resolveSide(row, input.actorUserId, input.actorRole);

    try {
      assertCancellationReason(side, input.reasonCode, input.description);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "CANCELLATION_DESCRIPTION_REQUIRED"
          ? "برای گزینه «سایر» توضیح حداقل ۱۰ کاراکتری لازم است."
          : "دلیل لغو برای این نوع کاربر معتبر نیست.";
      throw new AppError(message, "INVALID_CANCELLATION_REASON", 422);
    }

    const existing = await db
      .select()
      .from(cancellations)
      .where(eq(cancellations.assignmentId, input.assignmentId))
      .limit(1);
    if (existing[0]) return this.serializeExisting(existing[0], true);

    const now = new Date();
    const preview = await this.buildPreview(row, side, now);
    const cancellationId = `can_${crypto.randomUUID()}`;

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`cancel:${input.assignmentId}`}))`
      );

      const [alreadyRecorded] = await tx
        .select()
        .from(cancellations)
        .where(eq(cancellations.assignmentId, input.assignmentId))
        .limit(1);
      if (alreadyRecorded) {
        return { existing: alreadyRecorded } as const;
      }

      const [freshAssignment] = await tx
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, input.assignmentId))
        .limit(1);
      if (!freshAssignment) {
        throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
      }

      AssignmentStateMachine.assertCanTransition(freshAssignment.state, preview.targetState);

      const updated = await tx
        .update(shiftAssignments)
        .set({ state: preview.targetState, updatedAt: now })
        .where(
          and(
            eq(shiftAssignments.id, input.assignmentId),
            eq(shiftAssignments.state, freshAssignment.state)
          )
        )
        .returning({ id: shiftAssignments.id });
      if (updated.length !== 1) {
        throw new AppError("وضعیت Assignment همزمان تغییر کرده است.", "CONFLICT", 409);
      }

      if (freshAssignment.shiftSlotId) {
        await tx
          .update(shiftSlots)
          .set({ status: "OPEN" })
          .where(eq(shiftSlots.id, freshAssignment.shiftSlotId));
      }

      await tx.insert(cancellations).values({
        id: cancellationId,
        assignmentId: input.assignmentId,
        cancelledByUserId: input.actorUserId,
        cancelledBySide: side,
        reason: input.description?.trim() || input.reasonCode,
        reasonCode: input.reasonCode,
        description: input.description?.trim() || null,
        hoursBeforeStart: preview.hoursBeforeStart,
        minutesBeforeStart: preview.minutesBeforeStart,
        isLate: preview.isLate ? 1 : 0,
        penaltyRials: BigInt(preview.penaltyRials),
        workerCompensationRials: BigInt(preview.workerCompensationRials),
        scoreImpact: preview.scoreImpact.toFixed(2),
        policySnapshot: {
          side,
          scheduledPayRials: preview.scheduledPayRials,
          lateThresholdHours: preview.policy.lateThresholdHours,
          tier: preview.policyTier,
          monetarySettlementDeferred: true,
        },
        createdAt: now,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorUserId,
        entityName: "shift_assignment",
        entityId: input.assignmentId,
        action: side === "WORKER" ? "ASSIGNMENT_CANCELLED_BY_WORKER" : "ASSIGNMENT_CANCELLED_BY_EMPLOYER",
        details: {
          cancellationId,
          from: freshAssignment.state,
          to: preview.targetState,
          reasonCode: input.reasonCode,
          hoursBeforeStart: preview.hoursBeforeStart,
          isLate: preview.isLate,
          penaltyRials: preview.penaltyRials,
          workerCompensationRials: preview.workerCompensationRials,
          scoreImpact: preview.scoreImpact,
          monetarySettlementDeferred: true,
        },
      });

      return { existing: null } as const;
    });

    if (outcome.existing) return this.serializeExisting(outcome.existing, true);

    const assignmentPayload = {
      assignmentId: input.assignmentId,
      shiftId: row.shift.id,
      state: preview.targetState,
    };
    publishRealtimeEvent("assignment", input.assignmentId, "assignment.updated", assignmentPayload);
    publishRealtimeEvent("shift", row.shift.id, "assignment.updated", assignmentPayload);
    publishRealtimeEvent("shift", row.shift.id, "shift.updated", {
      shiftId: row.shift.id,
      status: row.shift.status,
    });
    publishRealtimeEvent("user", row.assignment.workerId, "assignment.updated", assignmentPayload);
    if (side === "WORKER") {
      publishRealtimeEvent("user", row.shift.employerId, "assignment.updated", assignmentPayload);
    }

    return {
      cancellationId,
      assignmentId: input.assignmentId,
      side,
      newState: preview.targetState,
      reasonCode: input.reasonCode,
      hoursBeforeStart: preview.hoursBeforeStart,
      minutesBeforeStart: preview.minutesBeforeStart,
      isLate: preview.isLate,
      penaltyRials: preview.penaltyRials,
      workerCompensationRials: preview.workerCompensationRials,
      scoreImpact: preview.scoreImpact,
      monetarySettlementDeferred: true,
      idempotent: false,
      cancelledAt: now.toISOString(),
    };
  }

  private serializeExisting(
    record: typeof cancellations.$inferSelect,
    idempotent: boolean
  ) {
    return {
      cancellationId: record.id,
      assignmentId: record.assignmentId,
      side: record.cancelledBySide,
      newState:
        record.cancelledBySide === "WORKER"
          ? ("CANCELLED_BY_WORKER" as const)
          : ("CANCELLED_BY_EMPLOYER" as const),
      reasonCode: record.reasonCode,
      hoursBeforeStart: record.hoursBeforeStart,
      minutesBeforeStart: record.minutesBeforeStart,
      isLate: Boolean(record.isLate),
      penaltyRials: record.penaltyRials.toString(),
      workerCompensationRials: record.workerCompensationRials.toString(),
      scoreImpact: Number(record.scoreImpact),
      monetarySettlementDeferred: true as const,
      idempotent,
      cancelledAt: record.createdAt.toISOString(),
    };
  }
}
