import { db } from "@/db";
import { shifts, shiftAssignments, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export type ShiftStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "MATCHING"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "TIMESHEET_PENDING"
  | "APPROVED"
  | "SETTLED"
  | "CANCELLED"
  | "EXPIRED"
  | "DISPUTED";

export type ShiftAssignmentState =
  | "OFFERED"
  | "VIEWED"
  | "ACCEPTED"
  | "DECLINED"
  | "RECONFIRM_PENDING"
  | "CONFIRMED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "CHECKED_IN"
  | "ON_BREAK"
  | "CHECKED_OUT"
  | "COMPLETED"
  | "CANCELLED_BY_WORKER"
  | "CANCELLED_BY_EMPLOYER"
  | "NO_SHOW"
  | "LEFT_EARLY"
  | "REPLACED"
  | "REMOVED";

export const SHIFT_TRANSITION_MAP: Record<ShiftStatus, ShiftStatus[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["MATCHING", "PARTIALLY_FILLED", "FILLED", "CANCELLED", "EXPIRED"],
  MATCHING: ["PARTIALLY_FILLED", "FILLED", "CANCELLED", "EXPIRED"],
  PARTIALLY_FILLED: ["FILLED", "CONFIRMED", "IN_PROGRESS", "CANCELLED", "EXPIRED"],
  FILLED: ["CONFIRMED", "IN_PROGRESS", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "TIMESHEET_PENDING", "CANCELLED", "DISPUTED"],
  COMPLETED: ["TIMESHEET_PENDING", "APPROVED", "DISPUTED"],
  TIMESHEET_PENDING: ["APPROVED", "DISPUTED"],
  APPROVED: ["SETTLED", "DISPUTED"],
  SETTLED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: ["APPROVED", "SETTLED", "CANCELLED"],
};

export const ASSIGNMENT_TRANSITION_MAP: Record<
  ShiftAssignmentState,
  ShiftAssignmentState[]
> = {
  OFFERED: ["VIEWED", "ACCEPTED", "DECLINED", "CANCELLED_BY_EMPLOYER", "REMOVED"],
  VIEWED: ["ACCEPTED", "DECLINED", "CANCELLED_BY_EMPLOYER", "REMOVED"],
  ACCEPTED: [
    "RECONFIRM_PENDING",
    "CONFIRMED",
    "CANCELLED_BY_WORKER",
    "CANCELLED_BY_EMPLOYER",
    "REPLACED",
  ],
  DECLINED: [],
  RECONFIRM_PENDING: [
    "CONFIRMED",
    "CANCELLED_BY_WORKER",
    "CANCELLED_BY_EMPLOYER",
    "NO_SHOW",
    "REPLACED",
  ],
  CONFIRMED: [
    "EN_ROUTE",
    "CANCELLED_BY_WORKER",
    "CANCELLED_BY_EMPLOYER",
    "NO_SHOW",
    "REPLACED",
  ],
  EN_ROUTE: [
    "ARRIVED",
    "NO_SHOW",
    "CANCELLED_BY_WORKER",
    "CANCELLED_BY_EMPLOYER",
  ],
  ARRIVED: [
    "CHECKED_IN",
    "NO_SHOW",
    "CANCELLED_BY_WORKER",
    "CANCELLED_BY_EMPLOYER",
  ],
  CHECKED_IN: ["ON_BREAK", "CHECKED_OUT", "LEFT_EARLY", "COMPLETED"],
  ON_BREAK: ["CHECKED_IN", "CHECKED_OUT", "LEFT_EARLY"],
  CHECKED_OUT: ["COMPLETED", "LEFT_EARLY"],
  COMPLETED: [],
  CANCELLED_BY_WORKER: [],
  CANCELLED_BY_EMPLOYER: [],
  NO_SHOW: [],
  LEFT_EARLY: ["COMPLETED"],
  REPLACED: [],
  REMOVED: [],
};

export class StateMachineService {
  canTransitionShift(from: ShiftStatus, to: ShiftStatus): boolean {
    return (SHIFT_TRANSITION_MAP[from] || []).includes(to);
  }

  canTransitionAssignment(
    from: ShiftAssignmentState,
    to: ShiftAssignmentState
  ): boolean {
    return (ASSIGNMENT_TRANSITION_MAP[from] || []).includes(to);
  }

  async transitionShift(
    shiftId: string,
    nextStatus: ShiftStatus,
    actorId: string,
    reason?: string
  ): Promise<{ previousStatus: ShiftStatus; newStatus: ShiftStatus }> {
    const shiftList = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
    if (shiftList.length === 0) throw new AppError("شیفت کاری یافت نشد.", "NOT_FOUND", 404);

    const currentStatus = shiftList[0].status as ShiftStatus;
    if (!this.canTransitionShift(currentStatus, nextStatus)) {
      throw new AppError(
        `تغییر وضعیت نامعتبر شیفت از ${currentStatus} به ${nextStatus}`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    await db.transaction(async (tx) => {
      await tx.update(shifts).set({ status: nextStatus, updatedAt: new Date() }).where(eq(shifts.id, shiftId));
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId,
        entityName: "shift",
        entityId: shiftId,
        action: "SHIFT_STATUS_TRANSITION",
        details: { from: currentStatus, to: nextStatus, reason },
      });
    });

    return { previousStatus: currentStatus, newStatus: nextStatus };
  }

  async transitionAssignment(
    assignmentId: string,
    nextState: ShiftAssignmentState,
    actorId: string,
    reason?: string
  ): Promise<{ previousState: ShiftAssignmentState; newState: ShiftAssignmentState }> {
    const assignmentList = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (assignmentList.length === 0) {
      throw new AppError("شیفت اختصاص‌یافته یافت نشد.", "NOT_FOUND", 404);
    }

    const currentState = assignmentList[0].state as ShiftAssignmentState;
    if (!this.canTransitionAssignment(currentState, nextState)) {
      throw new AppError(
        `تغییر وضعیت نامعتبر اختصاص شیفت از ${currentState} به ${nextState}`,
        "INVALID_STATE_TRANSITION",
        400
      );
    }

    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = { state: nextState, updatedAt: new Date() };
      if (nextState === "CHECKED_IN") updateData.checkedInAt = new Date();
      else if (nextState === "CHECKED_OUT" || nextState === "COMPLETED") updateData.checkedOutAt = new Date();

      await tx.update(shiftAssignments).set(updateData).where(eq(shiftAssignments.id, assignmentId));
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "ASSIGNMENT_STATE_TRANSITION",
        details: { from: currentState, to: nextState, reason },
      });
    });

    return { previousState: currentState, newState: nextState };
  }
}
