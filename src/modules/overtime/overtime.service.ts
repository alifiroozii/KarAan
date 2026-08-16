import crypto from "crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { branches, businessMembers } from "@/db/schema/employers";
import { overtimeRequests } from "@/db/schema/overtime";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { AppError } from "@/lib/errors";
import { scheduleOvertimeExpiration } from "@/lib/queue/overtime.queue";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";
import { expireOvertimeRequest } from "./overtime-expiration";

export type OvertimeRateType = "NORMAL_RATE" | "MULTIPLIER" | "FIXED_BONUS";

export class OvertimeService {
  private async readMinutesSetting(key: string, fallback: number): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
    if (raw && typeof raw === "object" && "minutes" in raw) {
      const value = Number((raw as Record<string, unknown>).minutes);
      if (Number.isFinite(value)) return Math.max(1, Math.floor(value));
    }
    return fallback;
  }

  private async canManageShift(
    shift: { employerId: string; businessId: string | null; branchId: string | null },
    actorUserId: string,
    role: UserRole
  ) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
    if (shift.employerId === actorUserId) return true;

    if (shift.branchId) {
      const [managed] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, shift.branchId), eq(branches.managerUserId, actorUserId)))
        .limit(1);
      if (managed) return true;
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

  private async loadAssignment(assignmentId: string) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  async request(input: {
    assignmentId: string;
    actorUserId: string;
    actorRole: UserRole;
    requestedEndAt: Date;
    rateType: OvertimeRateType;
    rateMultiplierBps: number;
    fixedBonusRials: bigint;
    note?: string;
  }) {
    const row = await this.loadAssignment(input.assignmentId);
    if (!(await this.canManageShift(row.shift, input.actorUserId, input.actorRole))) {
      throw new AppError("دسترسی درخواست اضافه‌کاری ندارید.", "FORBIDDEN", 403);
    }
    if (!["CHECKED_IN", "ON_BREAK"].includes(row.assignment.state)) {
      throw new AppError("Worker باید ابتدا وارد شیفت شده باشد.", "INVALID_ASSIGNMENT_STATE", 400);
    }

    if (input.rateType === "MULTIPLIER") {
      if (input.rateMultiplierBps < 10_000 || input.rateMultiplierBps > 30_000) {
        throw new AppError("ضریب اضافه‌کاری معتبر نیست.", "BAD_REQUEST", 400);
      }
    } else if (input.rateMultiplierBps !== 10_000) {
      throw new AppError("ضریب فقط برای نوع MULTIPLIER قابل استفاده است.", "BAD_REQUEST", 400);
    }
    if (input.fixedBonusRials < 0n) {
      throw new AppError("پاداش ثابت نمی‌تواند منفی باشد.", "BAD_REQUEST", 400);
    }
    if (input.rateType === "FIXED_BONUS" && input.fixedBonusRials <= 0n) {
      throw new AppError("برای این نوع اضافه‌کاری پاداش ثابت لازم است.", "BAD_REQUEST", 400);
    }

    const [maxMinutes, responseTtlMinutes] = await Promise.all([
      this.readMinutesSetting("overtime.max_minutes", 240),
      this.readMinutesSetting("overtime.response_ttl_minutes", 15),
    ]);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + responseTtlMinutes * 60_000);
    const id = `ot_${crypto.randomUUID()}`;
    let originalEndAt: Date | null = null;
    let requestedMinutes = 0;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`overtime:${input.assignmentId}`}))`
      );

      const [freshAssignment] = await tx
        .select({
          state: shiftAssignments.state,
          effectiveEndAt: shiftAssignments.effectiveEndAt,
          workerId: shiftAssignments.workerId,
        })
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, input.assignmentId))
        .limit(1);

      if (!freshAssignment || !["CHECKED_IN", "ON_BREAK"].includes(freshAssignment.state)) {
        throw new AppError("وضعیت Worker دیگر اجازه درخواست اضافه‌کاری نمی‌دهد.", "INVALID_ASSIGNMENT_STATE", 409);
      }

      originalEndAt = freshAssignment.effectiveEndAt ?? row.shift.endAt;
      requestedMinutes = Math.floor(
        (input.requestedEndAt.getTime() - originalEndAt.getTime()) / 60_000
      );
      if (requestedMinutes <= 0) {
        throw new AppError("زمان پایان پیشنهادی باید بعد از پایان فعلی Worker باشد.", "BAD_REQUEST", 400);
      }
      if (requestedMinutes > maxMinutes) {
        throw new AppError("مدت اضافه‌کاری از سقف مجاز بیشتر است.", "BAD_REQUEST", 400, {
          requestedMinutes,
          maxMinutes,
        });
      }

      const pending = await tx
        .select({ id: overtimeRequests.id, expiresAt: overtimeRequests.expiresAt })
        .from(overtimeRequests)
        .where(
          and(
            eq(overtimeRequests.assignmentId, input.assignmentId),
            eq(overtimeRequests.status, "PENDING")
          )
        );

      for (const item of pending) {
        if (item.expiresAt <= now) {
          await tx
            .update(overtimeRequests)
            .set({ status: "EXPIRED", updatedAt: now })
            .where(
              and(
                eq(overtimeRequests.id, item.id),
                eq(overtimeRequests.status, "PENDING")
              )
            );
        } else {
          throw new AppError("یک درخواست اضافه‌کاری فعال از قبل وجود دارد.", "CONFLICT", 409);
        }
      }

      await tx.insert(overtimeRequests).values({
        id,
        assignmentId: input.assignmentId,
        shiftId: row.shift.id,
        workerId: freshAssignment.workerId,
        requestedByUserId: input.actorUserId,
        originalEndAt,
        requestedEndAt: input.requestedEndAt,
        requestedMinutes,
        rateType: input.rateType,
        rateMultiplierBps:
          input.rateType === "MULTIPLIER" ? input.rateMultiplierBps : 10_000,
        fixedBonusRials:
          input.rateType === "FIXED_BONUS" ? input.fixedBonusRials : 0n,
        note: input.note,
        status: "PENDING",
        expiresAt,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorUserId,
        entityName: "overtime_request",
        entityId: id,
        action: "OVERTIME_REQUESTED",
        details: {
          assignmentId: input.assignmentId,
          originalEndAt: originalEndAt.toISOString(),
          requestedMinutes,
          requestedEndAt: input.requestedEndAt.toISOString(),
          rateType: input.rateType,
          rateMultiplierBps:
            input.rateType === "MULTIPLIER" ? input.rateMultiplierBps : 10_000,
          fixedBonusRials:
            input.rateType === "FIXED_BONUS" ? input.fixedBonusRials.toString() : "0",
          expiresAt: expiresAt.toISOString(),
        },
      });
    });

    try {
      await scheduleOvertimeExpiration(id, expiresAt);
    } catch (error) {
      // Lazy-expiration in respond/get paths remains authoritative if Redis is temporarily unavailable.
      console.error("[Overtime Expiration Schedule Error]", {
        overtimeRequestId: id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    const payload = {
      overtimeRequestId: id,
      assignmentId: input.assignmentId,
      shiftId: row.shift.id,
      workerId: row.assignment.workerId,
      requestedEndAt: input.requestedEndAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    publishRealtimeEvent("assignment", input.assignmentId, "overtime.requested", payload);
    publishRealtimeEvent("shift", row.shift.id, "overtime.requested", payload);
    publishRealtimeEvent("user", row.assignment.workerId, "overtime.requested", payload);

    return this.getById(id);
  }

  async respond(
    id: string,
    workerUserId: string,
    response: "ACCEPTED" | "DECLINED"
  ) {
    const [initial] = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.id, id))
      .limit(1);
    if (!initial) throw new AppError("درخواست اضافه‌کاری پیدا نشد.", "NOT_FOUND", 404);
    if (initial.workerId !== workerUserId) {
      throw new AppError("این درخواست برای Worker دیگری است.", "FORBIDDEN", 403);
    }
    if (initial.status === response) return this.getById(id);
    if (initial.status !== "PENDING") {
      throw new AppError("این درخواست دیگر قابل پاسخ نیست.", "CONFLICT", 409);
    }
    if (initial.expiresAt <= new Date()) {
      await expireOvertimeRequest(id);
      throw new AppError("مهلت پاسخ به درخواست اضافه‌کاری تمام شده است.", "BAD_REQUEST", 410);
    }

    let assignmentState = "";
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`overtime:${initial.assignmentId}`}))`
      );

      const [item] = await tx
        .select()
        .from(overtimeRequests)
        .where(eq(overtimeRequests.id, id))
        .limit(1);
      if (!item) throw new AppError("درخواست اضافه‌کاری پیدا نشد.", "NOT_FOUND", 404);
      if (item.status !== "PENDING") {
        if (item.status === response) return;
        throw new AppError("درخواست همزمان تغییر کرده است.", "CONFLICT", 409);
      }
      const now = new Date();
      if (item.expiresAt <= now) {
        await tx
          .update(overtimeRequests)
          .set({ status: "EXPIRED", updatedAt: now })
          .where(eq(overtimeRequests.id, id));
        throw new AppError("مهلت پاسخ به درخواست اضافه‌کاری تمام شده است.", "BAD_REQUEST", 410);
      }

      const [assignment] = await tx
        .select({ state: shiftAssignments.state, effectiveEndAt: shiftAssignments.effectiveEndAt })
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, item.assignmentId))
        .limit(1);
      if (!assignment || !["CHECKED_IN", "ON_BREAK"].includes(assignment.state)) {
        throw new AppError("Worker دیگر در وضعیت قابل تمدید نیست.", "INVALID_ASSIGNMENT_STATE", 409);
      }
      assignmentState = assignment.state;

      const [updated] = await tx
        .update(overtimeRequests)
        .set({ status: response, respondedAt: now, updatedAt: now })
        .where(
          and(
            eq(overtimeRequests.id, id),
            eq(overtimeRequests.status, "PENDING")
          )
        )
        .returning({ id: overtimeRequests.id });
      if (!updated) {
        throw new AppError("درخواست همزمان تغییر کرده است.", "CONFLICT", 409);
      }

      if (response === "ACCEPTED") {
        const nextEffectiveEndAt =
          !assignment.effectiveEndAt || item.requestedEndAt > assignment.effectiveEndAt
            ? item.requestedEndAt
            : assignment.effectiveEndAt;
        await tx
          .update(shiftAssignments)
          .set({ effectiveEndAt: nextEffectiveEndAt, updatedAt: now })
          .where(eq(shiftAssignments.id, item.assignmentId));
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "overtime_request",
        entityId: id,
        action: response === "ACCEPTED" ? "OVERTIME_ACCEPTED" : "OVERTIME_DECLINED",
        details: {
          assignmentId: item.assignmentId,
          effectiveEndAt: response === "ACCEPTED" ? item.requestedEndAt.toISOString() : null,
        },
      });
    });

    const event = response === "ACCEPTED" ? "overtime.accepted" : "overtime.declined";
    const payload = response === "ACCEPTED"
      ? {
          overtimeRequestId: id,
          assignmentId: initial.assignmentId,
          shiftId: initial.shiftId,
          workerId: initial.workerId,
          requestedEndAt: initial.requestedEndAt.toISOString(),
        }
      : {
          overtimeRequestId: id,
          assignmentId: initial.assignmentId,
          shiftId: initial.shiftId,
          workerId: initial.workerId,
        };
    publishRealtimeEvent("assignment", initial.assignmentId, event, payload);
    publishRealtimeEvent("shift", initial.shiftId, event, payload);
    publishRealtimeEvent("user", initial.workerId, event, payload);
    if (response === "ACCEPTED") {
      publishRealtimeEvent("assignment", initial.assignmentId, "assignment.updated", {
        assignmentId: initial.assignmentId,
        shiftId: initial.shiftId,
        state: assignmentState,
      });
    }

    return this.getById(id);
  }

  async cancel(id: string, actorUserId: string, actorRole: UserRole) {
    const [initial] = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.id, id))
      .limit(1);
    if (!initial) throw new AppError("درخواست اضافه‌کاری پیدا نشد.", "NOT_FOUND", 404);
    const row = await this.loadAssignment(initial.assignmentId);
    if (!(await this.canManageShift(row.shift, actorUserId, actorRole))) {
      throw new AppError("دسترسی لغو درخواست را ندارید.", "FORBIDDEN", 403);
    }
    if (initial.status === "CANCELLED") return this.getById(id);
    if (initial.status !== "PENDING") {
      throw new AppError("فقط درخواست در انتظار را می‌توان لغو کرد.", "CONFLICT", 409);
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`overtime:${initial.assignmentId}`}))`
      );
      const [updated] = await tx
        .update(overtimeRequests)
        .set({ status: "CANCELLED", updatedAt: now })
        .where(
          and(
            eq(overtimeRequests.id, id),
            eq(overtimeRequests.status, "PENDING")
          )
        )
        .returning({ id: overtimeRequests.id });
      if (!updated) {
        const [current] = await tx
          .select({ status: overtimeRequests.status })
          .from(overtimeRequests)
          .where(eq(overtimeRequests.id, id))
          .limit(1);
        if (current?.status === "CANCELLED") return;
        throw new AppError("درخواست همزمان تغییر کرده است.", "CONFLICT", 409);
      }
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "overtime_request",
        entityId: id,
        action: "OVERTIME_CANCELLED",
        details: { assignmentId: initial.assignmentId },
      });
    });

    const payload = {
      overtimeRequestId: id,
      assignmentId: initial.assignmentId,
      shiftId: initial.shiftId,
      workerId: initial.workerId,
    };
    publishRealtimeEvent("assignment", initial.assignmentId, "overtime.cancelled", payload);
    publishRealtimeEvent("shift", initial.shiftId, "overtime.cancelled", payload);
    publishRealtimeEvent("user", initial.workerId, "overtime.cancelled", payload);
    return this.getById(id);
  }

  async getForAssignment(assignmentId: string, workerUserId?: string) {
    const row = await this.loadAssignment(assignmentId);
    if (workerUserId && row.assignment.workerId !== workerUserId) {
      throw new AppError("دسترسی به اضافه‌کاری این شیفت ندارید.", "FORBIDDEN", 403);
    }

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
    return items.map((item) => this.serialize(item));
  }

  async getAcceptedForAssignment(assignmentId: string) {
    return db
      .select()
      .from(overtimeRequests)
      .where(
        and(
          eq(overtimeRequests.assignmentId, assignmentId),
          eq(overtimeRequests.status, "ACCEPTED")
        )
      )
      .orderBy(asc(overtimeRequests.originalEndAt));
  }

  private async getById(id: string) {
    const [item] = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.id, id))
      .limit(1);
    if (!item) throw new AppError("درخواست اضافه‌کاری پیدا نشد.", "NOT_FOUND", 404);
    return this.serialize(item);
  }

  private serialize(item: typeof overtimeRequests.$inferSelect) {
    return {
      ...item,
      fixedBonusRials: item.fixedBonusRials.toString(),
    };
  }
}
