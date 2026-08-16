import crypto from "crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  attendanceEvents,
  breaks,
  timesheets,
} from "@/db/schema/attendance";
import { branches, businessMembers } from "@/db/schema/employers";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { users } from "@/db/schema/users";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";
import { calculateTimesheet } from "./timesheet-calculator";

export interface TimesheetListFilters {
  branchId?: string;
  workerId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export class TimesheetEngineService {
  private async readRoundingIncrement(): Promise<1 | 5 | 15> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, "timesheet.rounding_increment_minutes"))
      .limit(1);

    const raw = setting?.value;
    const candidate =
      typeof raw === "number"
        ? raw
        : raw && typeof raw === "object" && "minutes" in raw
          ? Number((raw as Record<string, unknown>).minutes)
          : 1;

    return candidate === 5 || candidate === 15 ? candidate : 1;
  }

  private async loadCalculationInputs(assignmentId: string) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);

    const events = await db
      .select()
      .from(attendanceEvents)
      .where(eq(attendanceEvents.assignmentId, assignmentId))
      .orderBy(asc(attendanceEvents.timestamp));

    const checkIn = events.find((event) => event.eventType === "CHECK_IN");
    const checkOut = [...events].reverse().find((event) => event.eventType === "CHECK_OUT");

    if (!checkIn) throw new AppError("رویداد ورود یافت نشد.", "MISSING_CHECK_IN", 400);
    if (!checkOut) throw new AppError("رویداد خروج یافت نشد.", "CHECK_OUT_FAILED", 400);
    if (checkOut.timestamp <= checkIn.timestamp) {
      throw new AppError("ترتیب رویدادهای حضور معتبر نیست.", "CONFLICT", 409);
    }

    const breakRows = await db
      .select()
      .from(breaks)
      .where(eq(breaks.assignmentId, assignmentId))
      .orderBy(asc(breaks.startAt));

    let breakMinutes = 0;
    let previousEnd: Date | null = null;
    for (const item of breakRows) {
      if (!item.endAt) {
        throw new AppError(
          "یک استراحت فعال هنوز پایان نیافته است.",
          "ACTIVE_BREAK_EXISTS",
          400
        );
      }
      if (
        item.startAt < checkIn.timestamp ||
        item.endAt > checkOut.timestamp ||
        item.endAt <= item.startAt ||
        (previousEnd != null && item.startAt < previousEnd)
      ) {
        throw new AppError("ترتیب استراحت‌ها معتبر نیست.", "CONFLICT", 409, {
          breakId: item.id,
        });
      }
      breakMinutes += Math.max(
        0,
        Math.floor((item.endAt.getTime() - item.startAt.getTime()) / 60_000)
      );
      previousEnd = item.endAt;
    }

    const roundingIncrementMinutes = await this.readRoundingIncrement();
    const calculation = calculateTimesheet({
      scheduledStart: row.shift.startAt,
      scheduledEnd: row.shift.endAt,
      actualCheckIn: checkIn.timestamp,
      actualCheckOut: checkOut.timestamp,
      breakMinutes,
      paidBreak: Boolean(row.shift.isPaidBreak),
      hourlyRateRials: row.shift.hourlyPayRials,
      roundingIncrementMinutes,
    });

    return { row, checkIn, checkOut, breakRows, calculation };
  }

  private publishUpdated(input: {
    assignmentId: string;
    shiftId: string;
    workerId: string;
    timesheetId: string;
    status: string;
  }): void {
    const payload = { timesheetId: input.timesheetId, status: input.status };
    publishRealtimeEvent("assignment", input.assignmentId, "timesheet.updated", payload);
    publishRealtimeEvent("shift", input.shiftId, "timesheet.updated", payload);
    publishRealtimeEvent("user", input.workerId, "timesheet.updated", payload);
  }

  async createOrGetForAssignment(assignmentId: string) {
    const input = await this.loadCalculationInputs(assignmentId);
    const proposedStatus = input.calculation.requiresAdjustment
      ? "ADJUSTMENT_REQUIRED"
      : "SUBMITTED";
    let created = false;
    let timesheetId = "";

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`timesheet:${assignmentId}`}))`
      );

      const [existing] = await tx
        .select({ id: timesheets.id })
        .from(timesheets)
        .where(eq(timesheets.assignmentId, assignmentId))
        .limit(1);

      if (existing) {
        timesheetId = existing.id;
        return;
      }

      timesheetId = `ts_${crypto.randomUUID()}`;
      const now = new Date();
      await tx.insert(timesheets).values({
        id: timesheetId,
        assignmentId,
        grossMinutes: input.calculation.grossMinutes,
        breakMinutes: input.calculation.breakMinutes,
        paidBreakMinutes: input.calculation.paidBreakMinutes,
        unpaidBreakMinutes: input.calculation.unpaidBreakMinutes,
        netWorkedMinutes: input.calculation.payableMinutes,
        regularMinutes: input.calculation.regularMinutes,
        overtimeMinutes: input.calculation.overtimeMinutes,
        hourlyRateRials: input.calculation.hourlyRateRials,
        calculatedPayRials: input.calculation.calculatedPayRials,
        bonusRials: input.calculation.bonusRials,
        deductionRials: input.calculation.deductionRials,
        finalPayRials: input.calculation.finalPayRials,
        status: proposedStatus,
        submittedAt: now,
        updatedAt: now,
      });

      await tx
        .update(shiftAssignments)
        .set({
          actualPayRials: input.calculation.finalPayRials,
          updatedAt: now,
        })
        .where(eq(shiftAssignments.id, assignmentId));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.row.assignment.workerId,
        entityName: "timesheet",
        entityId: timesheetId,
        action: "TIMESHEET_CREATED",
        details: {
          assignmentId,
          status: proposedStatus,
          grossMinutes: input.calculation.grossMinutes,
          breakMinutes: input.calculation.breakMinutes,
          paidBreakMinutes: input.calculation.paidBreakMinutes,
          unpaidBreakMinutes: input.calculation.unpaidBreakMinutes,
          payableMinutes: input.calculation.payableMinutes,
          regularMinutes: input.calculation.regularMinutes,
          overtimeMinutes: input.calculation.overtimeMinutes,
          hourlyRateRials: input.calculation.hourlyRateRials.toString(),
          finalPayRials: input.calculation.finalPayRials.toString(),
        },
      });
      created = true;
    });

    if (created) {
      this.publishUpdated({
        assignmentId,
        shiftId: input.row.shift.id,
        workerId: input.row.assignment.workerId,
        timesheetId,
        status: proposedStatus,
      });
    }

    return this.getByIdInternal(timesheetId);
  }

  async recalculateForAssignment(assignmentId: string, actorUserId?: string) {
    const input = await this.loadCalculationInputs(assignmentId);
    const nextStatus = input.calculation.requiresAdjustment
      ? "ADJUSTMENT_REQUIRED"
      : "SUBMITTED";
    let timesheetId = "";

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`timesheet:${assignmentId}`}))`
      );
      const [current] = await tx
        .select()
        .from(timesheets)
        .where(eq(timesheets.assignmentId, assignmentId))
        .limit(1);

      if (!current) {
        throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);
      }
      if (["READY_FOR_SETTLEMENT", "SETTLED", "VOID"].includes(current.status)) {
        throw new AppError("این تایم‌شیت دیگر قابل محاسبه مجدد نیست.", "CONFLICT", 409);
      }

      timesheetId = current.id;
      const now = new Date();
      await tx
        .update(timesheets)
        .set({
          grossMinutes: input.calculation.grossMinutes,
          breakMinutes: input.calculation.breakMinutes,
          paidBreakMinutes: input.calculation.paidBreakMinutes,
          unpaidBreakMinutes: input.calculation.unpaidBreakMinutes,
          netWorkedMinutes: input.calculation.payableMinutes,
          regularMinutes: input.calculation.regularMinutes,
          overtimeMinutes: input.calculation.overtimeMinutes,
          hourlyRateRials: input.calculation.hourlyRateRials,
          calculatedPayRials: input.calculation.calculatedPayRials,
          bonusRials: input.calculation.bonusRials,
          deductionRials: input.calculation.deductionRials,
          finalPayRials: input.calculation.finalPayRials,
          status: nextStatus,
          updatedAt: now,
        })
        .where(eq(timesheets.id, current.id));

      await tx
        .update(shiftAssignments)
        .set({ actualPayRials: input.calculation.finalPayRials, updatedAt: now })
        .where(eq(shiftAssignments.id, assignmentId));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId ?? input.row.assignment.workerId,
        entityName: "timesheet",
        entityId: current.id,
        action: "TIMESHEET_RECALCULATED",
        details: {
          previousStatus: current.status,
          nextStatus,
          finalPayRials: input.calculation.finalPayRials.toString(),
        },
      });
    });

    this.publishUpdated({
      assignmentId,
      shiftId: input.row.shift.id,
      workerId: input.row.assignment.workerId,
      timesheetId,
      status: nextStatus,
    });
    return this.getByIdInternal(timesheetId);
  }

  private async getByIdInternal(timesheetId: string) {
    const [record] = await db
      .select({
        timesheet: timesheets,
        assignment: shiftAssignments,
        shift: shifts,
        workerName: users.fullName,
      })
      .from(timesheets)
      .innerJoin(shiftAssignments, eq(shiftAssignments.id, timesheets.assignmentId))
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!record) throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);

    const events = await db
      .select()
      .from(attendanceEvents)
      .where(eq(attendanceEvents.assignmentId, record.assignment.id))
      .orderBy(asc(attendanceEvents.timestamp));
    const checkIn = events.find((event) => event.eventType === "CHECK_IN");
    const checkOut = [...events].reverse().find((event) => event.eventType === "CHECK_OUT");
    const breakRows = await db
      .select()
      .from(breaks)
      .where(eq(breaks.assignmentId, record.assignment.id))
      .orderBy(asc(breaks.startAt));

    return {
      id: record.timesheet.id,
      assignmentId: record.assignment.id,
      workerId: record.assignment.workerId,
      workerName: record.workerName,
      shiftId: record.shift.id,
      businessId: record.shift.businessId,
      branchId: record.shift.branchId,
      title: record.shift.title,
      locationName: record.shift.locationName,
      scheduledStart: record.shift.startAt,
      scheduledEnd: record.shift.endAt,
      actualCheckIn: checkIn?.timestamp ?? record.assignment.checkedInAt,
      actualCheckOut: checkOut?.timestamp ?? record.assignment.checkedOutAt,
      grossMinutes: record.timesheet.grossMinutes,
      breakMinutes: record.timesheet.breakMinutes,
      paidBreakMinutes: record.timesheet.paidBreakMinutes,
      unpaidBreakMinutes: record.timesheet.unpaidBreakMinutes,
      netWorkedMinutes: record.timesheet.netWorkedMinutes,
      regularMinutes: record.timesheet.regularMinutes,
      overtimeMinutes: record.timesheet.overtimeMinutes,
      hourlyRateRials: record.timesheet.hourlyRateRials.toString(),
      calculatedPayRials: record.timesheet.calculatedPayRials.toString(),
      bonusRials: record.timesheet.bonusRials.toString(),
      deductionRials: record.timesheet.deductionRials.toString(),
      finalPayRials: record.timesheet.finalPayRials.toString(),
      requiresAdjustment: record.timesheet.status === "ADJUSTMENT_REQUIRED",
      status: record.timesheet.status,
      submittedAt: record.timesheet.submittedAt,
      approvedAt: record.timesheet.approvedAt,
      approvedByUserId: record.timesheet.approvedByUserId,
      readyForSettlementAt: record.timesheet.readyForSettlementAt,
      createdAt: record.timesheet.createdAt,
      updatedAt: record.timesheet.updatedAt,
      breaks: breakRows.map((item) => ({
        id: item.id,
        startAt: item.startAt,
        endAt: item.endAt,
        durationMinutes:
          item.endAt == null
            ? item.durationMinutes
            : Math.max(
                0,
                Math.floor((item.endAt.getTime() - item.startAt.getTime()) / 60_000)
              ),
      })),
    };
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

  async getForActor(timesheetId: string, actorUserId: string, role: UserRole) {
    const detail = await this.getByIdInternal(timesheetId);
    if (role === "WORKER") {
      if (detail.workerId !== actorUserId) {
        throw new AppError("دسترسی به این تایم‌شیت مجاز نیست.", "FORBIDDEN", 403);
      }
      return detail;
    }

    const [shift] = await db
      .select({ employerId: shifts.employerId, businessId: shifts.businessId, branchId: shifts.branchId })
      .from(shifts)
      .where(eq(shifts.id, detail.shiftId))
      .limit(1);

    if (!shift || !(await this.canManageShift(shift, actorUserId, role))) {
      throw new AppError("دسترسی به این تایم‌شیت مجاز نیست.", "FORBIDDEN", 403);
    }
    return detail;
  }

  async listForWorker(workerUserId: string, filters: TimesheetListFilters = {}) {
    const rows = await db
      .select({ id: timesheets.id })
      .from(timesheets)
      .innerJoin(shiftAssignments, eq(shiftAssignments.id, timesheets.assignmentId))
      .where(eq(shiftAssignments.workerId, workerUserId))
      .orderBy(desc(timesheets.createdAt));

    return this.applyListFilters(
      await Promise.all(rows.map((row) => this.getByIdInternal(row.id))),
      filters
    );
  }

  async listForEmployer(
    actorUserId: string,
    role: UserRole,
    filters: TimesheetListFilters = {}
  ) {
    const candidates = await db
      .select({
        id: timesheets.id,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
      })
      .from(timesheets)
      .innerJoin(shiftAssignments, eq(shiftAssignments.id, timesheets.assignmentId))
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .orderBy(desc(timesheets.createdAt));

    const visible: string[] = [];
    for (const item of candidates) {
      if (await this.canManageShift(item, actorUserId, role)) visible.push(item.id);
    }

    return this.applyListFilters(
      await Promise.all(visible.map((id) => this.getByIdInternal(id))),
      filters
    );
  }

  private applyListFilters<T extends {
    branchId: string | null;
    workerId: string;
    status: string;
    createdAt: Date;
  }>(items: T[], filters: TimesheetListFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const filtered = items.filter((item) => {
      if (filters.branchId && item.branchId !== filters.branchId) return false;
      if (filters.workerId && item.workerId !== filters.workerId) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.dateFrom && item.createdAt < filters.dateFrom) return false;
      if (filters.dateTo && item.createdAt > filters.dateTo) return false;
      return true;
    });
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    };
  }

  async approve(timesheetId: string, actorUserId: string, role: UserRole) {
    const detail = await this.getForActor(timesheetId, actorUserId, role);
    if (role === "WORKER") {
      throw new AppError("کارگر نمی‌تواند تایم‌شیت را تأیید کند.", "FORBIDDEN", 403);
    }
    if (detail.status === "READY_FOR_SETTLEMENT" || detail.status === "SETTLED") {
      return { ...detail, idempotent: true };
    }
    if (detail.status === "DISPUTED" || detail.status === "ADJUSTMENT_REQUIRED") {
      throw new AppError("این تایم‌شیت هنوز آماده تأیید نیست.", "CONFLICT", 409);
    }
    if (detail.status !== "SUBMITTED" && detail.status !== "APPROVED") {
      throw new AppError("وضعیت تایم‌شیت قابل تأیید نیست.", "CONFLICT", 409);
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`timesheet-approve:${timesheetId}`}))`
      );
      const [current] = await tx
        .select({ status: timesheets.status })
        .from(timesheets)
        .where(eq(timesheets.id, timesheetId))
        .limit(1);
      if (!current) throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);
      if (current.status === "READY_FOR_SETTLEMENT" || current.status === "SETTLED") return;
      if (current.status !== "SUBMITTED" && current.status !== "APPROVED") {
        throw new AppError("وضعیت تایم‌شیت قابل تأیید نیست.", "CONFLICT", 409);
      }

      await tx
        .update(timesheets)
        .set({
          status: "READY_FOR_SETTLEMENT",
          approvedAt: now,
          approvedByUserId: actorUserId,
          readyForSettlementAt: now,
          updatedAt: now,
        })
        .where(eq(timesheets.id, timesheetId));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "timesheet",
        entityId: timesheetId,
        action: "TIMESHEET_APPROVED",
        details: {
          assignmentId: detail.assignmentId,
          previousStatus: current.status,
          nextStatus: "READY_FOR_SETTLEMENT",
          finalPayRials: detail.finalPayRials,
          walletCredited: false,
        },
      });
    });

    this.publishUpdated({
      assignmentId: detail.assignmentId,
      shiftId: detail.shiftId,
      workerId: detail.workerId,
      timesheetId,
      status: "READY_FOR_SETTLEMENT",
    });
    return this.getByIdInternal(timesheetId);
  }

  async dispute(
    timesheetId: string,
    actorUserId: string,
    role: UserRole,
    reasonCode: string,
    description: string
  ) {
    const detail = await this.getForActor(timesheetId, actorUserId, role);
    if (["READY_FOR_SETTLEMENT", "SETTLED", "VOID"].includes(detail.status)) {
      throw new AppError("این تایم‌شیت در این مرحله قابل اختلاف نیست.", "CONFLICT", 409);
    }
    if (detail.status === "DISPUTED") return { ...detail, idempotent: true };

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`timesheet-dispute:${timesheetId}`}))`
      );
      await tx
        .update(timesheets)
        .set({ status: "DISPUTED", updatedAt: now })
        .where(eq(timesheets.id, timesheetId));
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "timesheet",
        entityId: timesheetId,
        action: "TIMESHEET_DISPUTED",
        details: { reasonCode, description },
      });
    });

    this.publishUpdated({
      assignmentId: detail.assignmentId,
      shiftId: detail.shiftId,
      workerId: detail.workerId,
      timesheetId,
      status: "DISPUTED",
    });
    return this.getByIdInternal(timesheetId);
  }
}
