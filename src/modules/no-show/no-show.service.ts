import crypto from "crypto";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { noShowEvents } from "@/db/schema/reliability";
import { shiftAssignments, shifts, shiftSlots } from "@/db/schema/shifts";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { users } from "@/db/schema/users";
import { getSMSAdapter } from "@/infrastructure/sms";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";
import type { UserRole } from "@/modules/auth/auth.service";
import {
  evaluateNoShowAt,
  isNoShowEligibleState,
  NO_SHOW_ELIGIBLE_ASSIGNMENT_STATES,
  normalizeNoShowPolicy,
  type NoShowPolicy,
} from "./no-show-policy";

const ATTENDANCE_RESOLUTION_STATES = [
  "CHECKED_IN",
  "ON_BREAK",
  "CHECKED_OUT",
  "COMPLETED",
  "LEFT_EARLY",
] as const;

interface AssignmentContext {
  assignment: typeof shiftAssignments.$inferSelect;
  shift: typeof shifts.$inferSelect;
  workerPhone: string;
}

export type NoShowDetectionResult =
  | { status: "NOT_DUE" | "SKIPPED"; assignmentId: string }
  | { status: "POTENTIAL"; assignmentId: string; noShowEventId: string; idempotent: boolean }
  | { status: "FINAL"; assignmentId: string; noShowEventId: string; idempotent: boolean }
  | { status: "RESOLVED"; assignmentId: string; noShowEventId: string; idempotent: boolean };

export class NoShowService {
  private readonly sms = getSMSAdapter();

  private async loadPolicy(): Promise<NoShowPolicy> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, "no_show.policy"))
      .limit(1);
    return normalizeNoShowPolicy(setting?.value);
  }

  private async loadAssignment(assignmentId: string): Promise<AssignmentContext> {
    const [row] = await db
      .select({
        assignment: shiftAssignments,
        shift: shifts,
        workerPhone: users.phone,
      })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("Assignment پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  async detectAssignment(
    assignmentId: string,
    now = new Date(),
    source = "SYSTEM"
  ): Promise<NoShowDetectionResult> {
    const [context, policy] = await Promise.all([
      this.loadAssignment(assignmentId),
      this.loadPolicy(),
    ]);
    const decision = evaluateNoShowAt({ shiftStartAt: context.shift.startAt, now, policy });

    if (decision.decision === "NOT_DUE") {
      return { status: "NOT_DUE", assignmentId };
    }

    let publishedStatus: "POTENTIAL" | "FINAL" | "RESOLVED" | null = null;
    let noShowEventId = "";
    let idempotent = false;
    let previousState = context.assignment.state;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`no-show:${assignmentId}`}))`
      );

      const [fresh] = await tx
        .select({ assignment: shiftAssignments, shift: shifts })
        .from(shiftAssignments)
        .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
        .where(eq(shiftAssignments.id, assignmentId))
        .limit(1);
      if (!fresh) throw new AppError("Assignment پیدا نشد.", "NOT_FOUND", 404);

      previousState = fresh.assignment.state;
      const [existing] = await tx
        .select()
        .from(noShowEvents)
        .where(eq(noShowEvents.assignmentId, assignmentId))
        .limit(1);

      if (!isNoShowEligibleState(fresh.assignment.state)) {
        if (
          existing?.status === "POTENTIAL" &&
          (ATTENDANCE_RESOLUTION_STATES as readonly string[]).includes(fresh.assignment.state)
        ) {
          await tx
            .update(noShowEvents)
            .set({
              status: "OVERRIDDEN",
              overriddenAt: now,
              overrideReason: `AUTO_RESOLVED_${fresh.assignment.state}`,
              metadata: {
                ...(existing.metadata ?? {}),
                automaticResolution: true,
                resolvedState: fresh.assignment.state,
              },
              updatedAt: now,
            })
            .where(eq(noShowEvents.id, existing.id));

          await tx.insert(auditLogs).values({
            id: `aud_${crypto.randomUUID()}`,
            actorId: null,
            entityName: "no_show_event",
            entityId: existing.id,
            action: "NO_SHOW_AUTO_RESOLVED",
            details: {
              assignmentId,
              assignmentState: fresh.assignment.state,
            },
          });
          publishedStatus = "RESOLVED";
          noShowEventId = existing.id;
          return;
        }

        idempotent = Boolean(existing?.status === "FINAL" || existing?.status === "OVERRIDDEN");
        noShowEventId = existing?.id ?? "";
        return;
      }

      const freshDecision = evaluateNoShowAt({
        shiftStartAt: fresh.shift.startAt,
        now,
        policy,
      });
      if (freshDecision.decision === "NOT_DUE") return;

      if (existing?.status === "OVERRIDDEN") {
        idempotent = true;
        noShowEventId = existing.id;
        return;
      }
      if (existing?.status === "FINAL") {
        publishedStatus = "FINAL";
        idempotent = true;
        noShowEventId = existing.id;
        return;
      }

      if (freshDecision.decision === "POTENTIAL") {
        if (existing?.status === "POTENTIAL") {
          publishedStatus = "POTENTIAL";
          idempotent = true;
          noShowEventId = existing.id;
          return;
        }

        noShowEventId = `nse_${crypto.randomUUID()}`;
        await tx.insert(noShowEvents).values({
          id: noShowEventId,
          assignmentId,
          workerId: fresh.assignment.workerId,
          reportedByUserId: null,
          status: "POTENTIAL",
          previousAssignmentState: fresh.assignment.state,
          detectionSource: source,
          gracePeriodMinutes: policy.gracePeriodMinutes,
          finalThresholdMinutes: policy.finalThresholdMinutes,
          reliabilityPenalty: policy.reliabilityPenalty.toFixed(2),
          strikeRecommended: policy.strikeRecommended ? 1 : 0,
          detectedAt: now,
          metadata: {
            minutesAfterStart: freshDecision.minutesAfterStart,
            reliabilityMutationDeferredToPrompt27: true,
          },
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: null,
          entityName: "no_show_event",
          entityId: noShowEventId,
          action: "NO_SHOW_POTENTIAL_DETECTED",
          details: {
            assignmentId,
            workerId: fresh.assignment.workerId,
            minutesAfterStart: freshDecision.minutesAfterStart,
            gracePeriodMinutes: policy.gracePeriodMinutes,
            finalThresholdMinutes: policy.finalThresholdMinutes,
          },
        });
        publishedStatus = "POTENTIAL";
        return;
      }

      AssignmentStateMachine.assertCanTransition(fresh.assignment.state, "NO_SHOW");
      const updated = await tx
        .update(shiftAssignments)
        .set({ state: "NO_SHOW", updatedAt: now })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            eq(shiftAssignments.state, fresh.assignment.state)
          )
        )
        .returning({ id: shiftAssignments.id });
      if (updated.length !== 1) {
        throw new AppError("وضعیت Assignment همزمان تغییر کرده است.", "CONFLICT", 409);
      }

      if (fresh.assignment.shiftSlotId) {
        await tx
          .update(shiftSlots)
          .set({ status: "OPEN" })
          .where(eq(shiftSlots.id, fresh.assignment.shiftSlotId));
      }

      if (existing?.status === "POTENTIAL") {
        noShowEventId = existing.id;
        await tx
          .update(noShowEvents)
          .set({
            status: "FINAL",
            previousAssignmentState: fresh.assignment.state,
            finalizedAt: now,
            reliabilityPenalty: policy.reliabilityPenalty.toFixed(2),
            strikeRecommended: policy.strikeRecommended ? 1 : 0,
            metadata: {
              ...(existing.metadata ?? {}),
              minutesAfterStart: freshDecision.minutesAfterStart,
              reliabilityMutationDeferredToPrompt27: true,
            },
            updatedAt: now,
          })
          .where(eq(noShowEvents.id, existing.id));
      } else {
        noShowEventId = `nse_${crypto.randomUUID()}`;
        await tx.insert(noShowEvents).values({
          id: noShowEventId,
          assignmentId,
          workerId: fresh.assignment.workerId,
          reportedByUserId: null,
          status: "FINAL",
          previousAssignmentState: fresh.assignment.state,
          detectionSource: source,
          gracePeriodMinutes: policy.gracePeriodMinutes,
          finalThresholdMinutes: policy.finalThresholdMinutes,
          reliabilityPenalty: policy.reliabilityPenalty.toFixed(2),
          strikeRecommended: policy.strikeRecommended ? 1 : 0,
          detectedAt: now,
          finalizedAt: now,
          metadata: {
            minutesAfterStart: freshDecision.minutesAfterStart,
            reliabilityMutationDeferredToPrompt27: true,
          },
          createdAt: now,
          updatedAt: now,
        });
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: null,
        entityName: "no_show_event",
        entityId: noShowEventId,
        action: "NO_SHOW_FINALIZED",
        details: {
          assignmentId,
          workerId: fresh.assignment.workerId,
          from: fresh.assignment.state,
          to: "NO_SHOW",
          minutesAfterStart: freshDecision.minutesAfterStart,
          reliabilityPenalty: policy.reliabilityPenalty,
          strikeRecommended: policy.strikeRecommended,
          reliabilityMutationDeferredToPrompt27: true,
          backfillDeferredToPrompt26: true,
        },
      });
      publishedStatus = "FINAL";
    });

    if (!publishedStatus) {
      return { status: "SKIPPED", assignmentId };
    }

    if (publishedStatus === "POTENTIAL" && !idempotent) {
      try {
        const minutesRemaining = Math.max(
          1,
          policy.finalThresholdMinutes - decision.minutesAfterStart
        );
        await this.sms.sendReminder(
          context.workerPhone,
          `هشدار کارآن: ورود شما به شیفت «${context.shift.title}» هنوز ثبت نشده است. حدود ${minutesRemaining} دقیقه تا ثبت نهایی عدم حضور فرصت دارید.`
        );
      } catch (error) {
        console.error("[No-show Potential SMS Error]", {
          assignmentId,
          message: error instanceof Error ? error.message : "unknown",
        });
      }

      const payload = {
        noShowEventId,
        assignmentId,
        workerId: context.assignment.workerId,
        shiftId: context.shift.id,
        finalizesAt: new Date(
          context.shift.startAt.getTime() + policy.finalThresholdMinutes * 60_000
        ).toISOString(),
      };
      publishRealtimeEvent("assignment", assignmentId, "no_show.potential", payload);
      publishRealtimeEvent("shift", context.shift.id, "no_show.potential", payload);
      publishRealtimeEvent("user", context.assignment.workerId, "no_show.potential", payload);
    }

    if (publishedStatus === "FINAL" && !idempotent) {
      try {
        await this.sms.sendReminder(
          context.workerPhone,
          `عدم حضور شما در شیفت «${context.shift.title}» ثبت شد. در صورت خطا از پشتیبانی درخواست بررسی کنید.`
        );
      } catch (error) {
        console.error("[No-show Final SMS Error]", {
          assignmentId,
          message: error instanceof Error ? error.message : "unknown",
        });
      }

      const finalPayload = {
        noShowEventId,
        assignmentId,
        workerId: context.assignment.workerId,
        shiftId: context.shift.id,
        previousState,
      };
      publishRealtimeEvent("assignment", assignmentId, "no_show.finalized", finalPayload);
      publishRealtimeEvent("shift", context.shift.id, "no_show.finalized", finalPayload);
      publishRealtimeEvent("user", context.assignment.workerId, "no_show.finalized", finalPayload);
      publishRealtimeEvent("shift", context.shift.id, "no_show.detected", {
        assignmentId,
        workerId: context.assignment.workerId,
      });
      publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
        assignmentId,
        shiftId: context.shift.id,
        state: "NO_SHOW",
      });
      publishRealtimeEvent("shift", context.shift.id, "assignment.updated", {
        assignmentId,
        shiftId: context.shift.id,
        state: "NO_SHOW",
      });
      publishRealtimeEvent("shift", context.shift.id, "backfill.requested", {
        shiftId: context.shift.id,
        neededSlots: 1,
      });
    }

    if (publishedStatus === "RESOLVED" && !idempotent) {
      const payload = {
        noShowEventId,
        assignmentId,
        workerId: context.assignment.workerId,
        shiftId: context.shift.id,
        reason: `AUTO_RESOLVED_${previousState}`,
      };
      publishRealtimeEvent("assignment", assignmentId, "no_show.overridden", payload);
      publishRealtimeEvent("shift", context.shift.id, "no_show.overridden", payload);
      publishRealtimeEvent("user", context.assignment.workerId, "no_show.overridden", payload);
    }

    return {
      status: publishedStatus,
      assignmentId,
      noShowEventId,
      idempotent,
    };
  }

  async scanDueAssignments(now = new Date()) {
    const policy = await this.loadPolicy();
    const cutoff = new Date(now.getTime() - policy.gracePeriodMinutes * 60_000);

    const dueAssignments = await db
      .select({ id: shiftAssignments.id })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(
        and(
          lte(shifts.startAt, cutoff),
          inArray(shiftAssignments.state, [...NO_SHOW_ELIGIBLE_ASSIGNMENT_STATES])
        )
      );

    const potentialToReconcile = await db
      .select({ id: shiftAssignments.id })
      .from(noShowEvents)
      .innerJoin(shiftAssignments, eq(shiftAssignments.id, noShowEvents.assignmentId))
      .where(eq(noShowEvents.status, "POTENTIAL"));

    const ids = Array.from(
      new Set([...dueAssignments.map((row) => row.id), ...potentialToReconcile.map((row) => row.id)])
    );

    const settled = await Promise.allSettled(
      ids.map((id) => this.detectAssignment(id, now, "SYSTEM_SCAN"))
    );
    const results: NoShowDetectionResult[] = [];
    const errors: Array<{ assignmentId: string; message: string }> = [];

    settled.forEach((item, index) => {
      if (item.status === "fulfilled") results.push(item.value);
      else {
        errors.push({
          assignmentId: ids[index],
          message: item.reason instanceof Error ? item.reason.message : "unknown",
        });
      }
    });

    return {
      scanned: ids.length,
      potential: results.filter((item) => item.status === "POTENTIAL" && !item.idempotent).length,
      finalized: results.filter((item) => item.status === "FINAL" && !item.idempotent).length,
      resolved: results.filter((item) => item.status === "RESOLVED" && !item.idempotent).length,
      errors,
    };
  }

  async override(input: {
    assignmentId: string;
    actorUserId: string;
    actorRole: UserRole;
    reason: string;
  }) {
    if (!["ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT", "DISPUTE_AGENT"].includes(input.actorRole)) {
      throw new AppError("دسترسی اصلاح No-show را ندارید.", "FORBIDDEN", 403);
    }
    if (input.reason.trim().length < 10) {
      throw new AppError("دلیل اصلاح باید حداقل ۱۰ کاراکتر باشد.", "VALIDATION_ERROR", 422);
    }

    const context = await this.loadAssignment(input.assignmentId);
    const now = new Date();
    let eventId = "";
    let restoredState: string | null = null;
    let idempotent = false;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`no-show:${input.assignmentId}`}))`
      );
      const [event] = await tx
        .select()
        .from(noShowEvents)
        .where(eq(noShowEvents.assignmentId, input.assignmentId))
        .limit(1);
      if (!event) throw new AppError("No-show برای این Assignment ثبت نشده است.", "NOT_FOUND", 404);
      eventId = event.id;

      if (event.status === "OVERRIDDEN") {
        idempotent = true;
        return;
      }

      const [assignment] = await tx
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, input.assignmentId))
        .limit(1);
      if (!assignment) throw new AppError("Assignment پیدا نشد.", "NOT_FOUND", 404);

      if (event.status === "FINAL" && assignment.state === "NO_SHOW") {
        const previous = event.previousAssignmentState;
        if (!previous || !isNoShowEligibleState(previous)) {
          throw new AppError("وضعیت قبلی قابل بازیابی نیست.", "CONFLICT", 409);
        }

        if (assignment.shiftSlotId) {
          const [slot] = await tx
            .select({ status: shiftSlots.status })
            .from(shiftSlots)
            .where(eq(shiftSlots.id, assignment.shiftSlotId))
            .limit(1);
          if (!slot || slot.status !== "OPEN") {
            throw new AppError(
              "برای این جایگاه نیروی جایگزین تخصیص یافته و بازیابی خودکار امن نیست.",
              "CONFLICT",
              409
            );
          }
          await tx
            .update(shiftSlots)
            .set({ status: "FILLED" })
            .where(eq(shiftSlots.id, assignment.shiftSlotId));
        }

        await tx
          .update(shiftAssignments)
          .set({ state: previous, updatedAt: now })
          .where(eq(shiftAssignments.id, input.assignmentId));
        restoredState = previous;
      }

      await tx
        .update(noShowEvents)
        .set({
          status: "OVERRIDDEN",
          overriddenAt: now,
          resolvedByUserId: input.actorUserId,
          overrideReason: input.reason.trim(),
          updatedAt: now,
        })
        .where(eq(noShowEvents.id, event.id));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorUserId,
        entityName: "no_show_event",
        entityId: event.id,
        action: "NO_SHOW_OVERRIDDEN",
        details: {
          assignmentId: input.assignmentId,
          previousStatus: event.status,
          restoredState,
          reason: input.reason.trim(),
        },
      });
    });

    if (!idempotent) {
      const payload = {
        noShowEventId: eventId,
        assignmentId: input.assignmentId,
        workerId: context.assignment.workerId,
        shiftId: context.shift.id,
        reason: input.reason.trim(),
      };
      publishRealtimeEvent("assignment", input.assignmentId, "no_show.overridden", payload);
      publishRealtimeEvent("shift", context.shift.id, "no_show.overridden", payload);
      publishRealtimeEvent("user", context.assignment.workerId, "no_show.overridden", payload);
      if (restoredState) {
        publishRealtimeEvent("assignment", input.assignmentId, "assignment.updated", {
          assignmentId: input.assignmentId,
          shiftId: context.shift.id,
          state: restoredState,
        });
        publishRealtimeEvent("shift", context.shift.id, "assignment.updated", {
          assignmentId: input.assignmentId,
          shiftId: context.shift.id,
          state: restoredState,
        });
      }
    }

    return {
      noShowEventId: eventId,
      assignmentId: input.assignmentId,
      status: "OVERRIDDEN" as const,
      restoredState,
      idempotent,
    };
  }
}
