import crypto from "crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { branches, businessMembers } from "@/db/schema/employers";
import { overtimeRequests } from "@/db/schema/overtime";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";

export type OvertimeRateType = "NORMAL_RATE" | "MULTIPLIER" | "FIXED_BONUS";

export class OvertimeService {
  private async readNumericSetting(
    key: string,
    fallback: number,
    property: "minutes"
  ): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(1, raw);
    if (raw && typeof raw === "object" && property in raw) {
      const value = Number((raw as Record<string, unknown>)[property]);
      if (Number.isFinite(value)) return Math.max(1, value);
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
    if (!inArray) {
      // Keeps tree-shaking/type imports deterministic; real state check is below.
    }
    if (!["CHECKED_IN", "ON_BREAK"].includes(row.assignment.state)) {
      throw new AppError("Worker باید ابتدا وارد شیفت شده باشد.", "INVALID_ASSIGNMENT_STATE", 400);
    }

    const requestedMinutes = Math.floor(
      (input.requestedEndAt.getTime() - row.shift.endAt.getTime()) / 60_000
    );
    if (requestedMinutes <= 0) {
      throw new AppError("زمان پایان پیشنهادی باید بعد از پایان فعلی شیفت باشد.", "BAD_REQUEST", 400);
    }
    const maxMinutes = await this.readNumericSetting("overtime.max_minutes", 240, "minutes");
    if (requestedMinutes > maxMinutes) {
      throw new AppError("مدت اضافه‌کاری از سقف مجاز بیشتر است.", "BAD_REQUEST", 400, {
        requestedMinutes,
        maxMinutes,
      });
    }

    if (input.rateType === "MULTIPLIER" && (input.rateMultiplierBps < 10000 || input.rateMultiplierBps > 30000)) {
      throw new AppError("ضریب اضافه‌کاری معتبر نیست.", "BAD_REQUEST", 400);
    }

    const responseTtlMinutes = await this.readNumericSetting(
      "overtime.response_ttl_minutes",
      15,
      "minutes"
    );
    const now = new Date();
    const expiresAt = new Date(now.getTime() + responseTtlMinutes * 60_000);
    const id = `ot_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`overtime:${input.assignmentId}`}))`
      );

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
            .where(eq(overtimeRequests.id, item.id));
        } else {
          throw new AppError("یک درخواست اضافه‌کاری فعال از قبل وجود دارد.", "CONFLICT", 409);
        }
      }

      await tx.insert(overtimeRequests).values({
        id,
        assignmentId: input.assignmentId,
        shiftId: row.shift.id,
        workerId: row.assignment.workerId,
        requestedByUserId: input.actorUserId,
        originalEndAt: row.shift.endAt,
        requestedEndAt: input.requestedEndAt,
        requestedMinutes,
        rateType: input.rateType,
        rateMultiplierBps: input.rateMultiplierBps,
        fixedBonusRials: input.fixedBonusRials,
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
          requestedMinutes,
          requestedEndAt: input.requestedEndAt.toISOString(),
          rateType: input.rateType,
          rateMultiplierBps: input.rateMultiplierBps,
          fixedBonusRials: input.fixedBonusRials.toString(),
          expiresAt: expiresAt.toISOString(),
        },
      });
    });

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
    const [item] = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.id, id))
      .limit(1);
    if (!item) throw new AppError("درخواست اضافه‌کاری پیدا نشد.", "NOT_FOUND", 404);
    if (item.workerId !== workerUserId) {
      throw new AppError("این درخواست برای Worker دیگری است.", "FORBIDDEN", 403);
    }
    if (item.status === response) return this.getById(id);
    if (item.status !== "PENDING") {
      throw new AppError("این درخواست دیگر قابل پاسخ نیست.", "CONFLICT", 409);
    }
    const now = new Date();
    if (item.expiresAt <= now) {
      await db
        .update(overtimeRequests)
        .set({ status: "EXPIRED", updatedAt: now })
        .where(eq(overtimeRequests.id, id));
      throw new AppError("مهلت پاسخ به درخواست اضافه‌کاری تمام شده است.", "BAD_REQUEST", 410);
    }

    await db.transaction(async (tx) => {
      const updated = await tx
        .update(overtimeRequests)
        .set({ status: response, respondedAt: now, updatedAt: now })
        .where(and(eq(overtimeRequests.id, id), eq(overtimeRequests.status, "PENDING")))
        .returning({ id: overtimeRequests.id });
      if (updated.length !== 1) {
        throw new AppError("درخواست همزمان تغییر کرده است.", "CONFLICT", 409);
      }
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "overtime_request",
        entityId: id,
        action: response === "ACCEPTED" ? "OVERTIME_ACCEPTED" : "OVERTIME_DECLINED",
        details: { assignmentId: item.assignmentId },
      });
    });

    const event = response === "ACCEPTED" ? "overtime.accepted" : "overtime.declined";
    const payload = response === "ACCEPTED"
      ? {
          overtimeRequestId: id,
          assignmentId: item.assignmentId,
          shiftId: item.shiftId,
          workerId,
          requestedEndAt: item.requestedEndAt.toISOString(),
        }
      : {
          overtimeRequestId: id,
          assignmentId: item.assignmentId,
          shiftId: item.shiftId,
          workerId,
        };
    publishRealtimeEvent("assignment", item.assignmentId, event, payload as never);
    publishRealtimeEvent("shift", item.shiftId, event, payload as never);

    return this.getById(id);
  }

  async cancel(id: string, actorUserId: string, actorRole: UserRole) {
    const [item] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, id)).limit(1);
    if (!item) throw new AppError("درخواست اضافه‌کاری پیدا نشد.", "NOT_FOUND", 404);
    const row = await this.loadAssignment(item.assignmentId);
    if (!(await this.canManageShift(row.shift, actorUserId, actorRole))) {
      throw new AppError("دسترسی لغو درخواست را ندارید.", "FORBIDDEN", 403);
    }
    if (item.status === "CANCELLED") return this.getById(id);
    if (item.status !== "PENDING") {
      throw new AppError("فقط درخواست در انتظار را می‌توان لغو کرد.", "CONFLICT", 409);
    }
    const now = new Date();
    await db
      .update(overtimeRequests)
      .set({ status: "CANCELLED", updatedAt: now })
      .where(eq(overtimeRequests.id, id));
    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: actorUserId,
      entityName: "overtime_request",
      entityId: id,
      action: "OVERTIME_CANCELLED",
      details: { assignmentId: item.assignmentId },
    });
    const payload = {
      overtimeRequestId: id,
      assignmentId: item.assignmentId,
      shiftId: item.shiftId,
      workerId: item.workerId,
    };
    publishRealtimeEvent("assignment", item.assignmentId, "overtime.cancelled", payload);
    publishRealtimeEvent("shift", item.shiftId, "overtime.cancelled", payload);
    return this.getById(id);
  }

  async getForAssignment(assignmentId: string, workerUserId?: string) {
    const row = await this.loadAssignment(assignmentId);
    if (workerUserId && row.assignment.workerId !== workerUserId) {
      throw new AppError("دسترسی به اضافه‌کاری این شیفت ندارید.", "FORBIDDEN", 403);
    }
    const items = await db
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.assignmentId, assignmentId))
      .orderBy(desc(overtimeRequests.createdAt));
    return items.map(this.serialize);
  }

  async getAcceptedForAssignment(assignmentId: string) {
    const [item] = await db
      .select()
      .from(overtimeRequests)
      .where(
        and(
          eq(overtimeRequests.assignmentId, assignmentId),
          eq(overtimeRequests.status, "ACCEPTED")
        )
      )
      .orderBy(desc(overtimeRequests.respondedAt))
      .limit(1);
    return item ?? null;
  }

  private async getById(id: string) {
    const [item] = await db.select().from(overtimeRequests).where(eq(overtimeRequests.id, id)).limit(1);
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
