import crypto from "crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  attendanceEvents,
  breaks,
  timesheets,
} from "@/db/schema/attendance";
import { branches, businessMembers } from "@/db/schema/employers";
import { auditLogs } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { users } from "@/db/schema/users";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";
import { calculateTimesheet } from "./timesheet-calculator";

export class TimesheetEngineService {
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

    const breakRows = await db
      .select()
      .from(breaks)
      .where(eq(breaks.assignmentId, assignmentId));

    if (breakRows.some((item) => item.endAt == null)) {
      throw new AppError(
        "یک استراحت فعال هنوز پایان نیافته است.",
        "ACTIVE_BREAK_EXISTS",
        400
      );
    }

    const breakMinutes = breakRows.reduce(
      (total, item) => total + Math.max(0, item.durationMinutes || 0),
      0
    );

    const calculation = calculateTimesheet({
      scheduledStart: row.shift.startAt,
      scheduledEnd: row.shift.endAt,
      actualCheckIn: checkIn.timestamp,
      actualCheckOut: checkOut.timestamp,
      breakMinutes,
      paidBreak: Boolean(row.shift.isPaidBreak),
      hourlyRateRials: row.shift.hourlyPayRials,
    });

    return { row, checkIn, checkOut, breakRows, calculation };
  }

  async createOrGetForAssignment(assignmentId: string) {
    let created = false;
    let timesheetId = "";
    let shiftId = "";
    let workerId = "";

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`timesheet:${assignmentId}`}))`
      );

      const [existing] = await tx
        .select()
        .from(timesheets)
        .where(eq(timesheets.assignmentId, assignmentId))
        .limit(1);

      if (existing) {
        timesheetId = existing.id;
        return;
      }

      const input = await this.loadCalculationInputs(assignmentId);
      shiftId = input.row.shift.id;
      workerId = input.row.assignment.workerId;
      timesheetId = `ts_${crypto.randomUUID()}`;

      await tx.insert(timesheets).values({
        id: timesheetId,
        assignmentId,
        grossMinutes: input.calculation.grossMinutes,
        breakMinutes: input.calculation.breakMinutes,
        netWorkedMinutes: input.calculation.payableMinutes,
        calculatedPayRials: input.calculation.calculatedPayRials,
        bonusRials: input.calculation.bonusRials,
        deductionRials: input.calculation.deductionRials,
        finalPayRials: input.calculation.finalPayRials,
        status: "SUBMITTED",
      });

      await tx
        .update(shiftAssignments)
        .set({
          actualPayRials: input.calculation.finalPayRials,
          updatedAt: new Date(),
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
          grossMinutes: input.calculation.grossMinutes,
          breakMinutes: input.calculation.breakMinutes,
          payableMinutes: input.calculation.payableMinutes,
          regularMinutes: input.calculation.regularMinutes,
          overtimeMinutes: input.calculation.overtimeMinutes,
          requiresAdjustment: input.calculation.requiresAdjustment,
          finalPayRials: input.calculation.finalPayRials.toString(),
        },
      });

      created = true;
    });

    if (created) {
      publishRealtimeEvent("assignment", assignmentId, "timesheet.updated", {
        timesheetId,
        status: "SUBMITTED",
      });
      if (shiftId) {
        publishRealtimeEvent("shift", shiftId, "timesheet.updated", {
          timesheetId,
          status: "SUBMITTED",
        });
      }
      if (workerId) {
        publishRealtimeEvent("user", workerId, "timesheet.updated", {
          timesheetId,
          status: "SUBMITTED",
        });
      }
    }

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
      .innerJoin(
        shiftAssignments,
        eq(shiftAssignments.id, timesheets.assignmentId)
      )
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!record) throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);

    const input = await this.loadCalculationInputs(record.assignment.id);

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
      actualCheckIn: input.checkIn.timestamp,
      actualCheckOut: input.checkOut.timestamp,
      grossMinutes: record.timesheet.grossMinutes,
      breakMinutes: record.timesheet.breakMinutes,
      netWorkedMinutes: record.timesheet.netWorkedMinutes,
      regularMinutes: input.calculation.regularMinutes,
      overtimeMinutes: input.calculation.overtimeMinutes,
      calculatedPayRials: record.timesheet.calculatedPayRials.toString(),
      bonusRials: record.timesheet.bonusRials.toString(),
      deductionRials: record.timesheet.deductionRials.toString(),
      finalPayRials: record.timesheet.finalPayRials.toString(),
      requiresAdjustment: input.calculation.requiresAdjustment,
      status: record.timesheet.status,
      approvedAt: record.timesheet.approvedAt,
      approvedByUserId: record.timesheet.approvedByUserId,
      createdAt: record.timesheet.createdAt,
      breaks: input.breakRows.map((item) => ({
        id: item.id,
        startAt: item.startAt,
        endAt: item.endAt,
        durationMinutes: item.durationMinutes,
      })),
    };
  }

  private async canManageShift(
    shift: {
      employerId: string;
      businessId: string | null;
      branchId: string | null;
    },
    actorUserId: string,
    role: UserRole
  ) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
    if (shift.employerId === actorUserId) return true;

    if (shift.branchId) {
      const [managed] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(
          and(eq(branches.id, shift.branchId), eq(branches.managerUserId, actorUserId))
        )
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
      .select({
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
      })
      .from(shifts)
      .where(eq(shifts.id, detail.shiftId))
      .limit(1);

    if (!shift || !(await this.canManageShift(shift, actorUserId, role))) {
      throw new AppError("دسترسی به این تایم‌شیت مجاز نیست.", "FORBIDDEN", 403);
    }
    return detail;
  }

  async listForWorker(workerUserId: string) {
    const rows = await db
      .select({ id: timesheets.id })
      .from(timesheets)
      .innerJoin(
        shiftAssignments,
        eq(shiftAssignments.id, timesheets.assignmentId)
      )
      .where(eq(shiftAssignments.workerId, workerUserId))
      .orderBy(desc(timesheets.createdAt));

    return Promise.all(rows.map((row) => this.getByIdInternal(row.id)));
  }

  async listForEmployer(actorUserId: string, role: UserRole) {
    const candidates = await db
      .select({
        id: timesheets.id,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
      })
      .from(timesheets)
      .innerJoin(
        shiftAssignments,
        eq(shiftAssignments.id, timesheets.assignmentId)
      )
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .orderBy(desc(timesheets.createdAt));

    const visible = [] as string[];
    for (const item of candidates) {
      if (await this.canManageShift(item, actorUserId, role)) visible.push(item.id);
    }
    return Promise.all(visible.map((id) => this.getByIdInternal(id)));
  }

  async approve(timesheetId: string, actorUserId: string, role: UserRole) {
    const detail = await this.getForActor(timesheetId, actorUserId, role);
    if (role === "WORKER") {
      throw new AppError("کارگر نمی‌تواند تایم‌شیت را تأیید کند.", "FORBIDDEN", 403);
    }

    if (detail.status === "APPROVED") return { ...detail, idempotent: true };
    if (detail.status === "DISPUTED") {
      throw new AppError("تایم‌شیت در وضعیت اختلاف است.", "CONFLICT", 409);
    }
    if (detail.requiresAdjustment) {
      throw new AppError(
        "این تایم‌شیت شامل اضافه‌کاری تأییدنشده است و ابتدا باید اصلاح شود.",
        "CONFLICT",
        409,
        { overtimeMinutes: detail.overtimeMinutes }
      );
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
      if (current.status === "APPROVED") return;
      if (current.status !== "SUBMITTED") {
        throw new AppError("وضعیت تایم‌شیت قابل تأیید نیست.", "CONFLICT", 409);
      }

      await tx
        .update(timesheets)
        .set({ status: "APPROVED", approvedAt: now, approvedByUserId: actorUserId })
        .where(eq(timesheets.id, timesheetId));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "timesheet",
        entityId: timesheetId,
        action: "TIMESHEET_APPROVED",
        details: {
          assignmentId: detail.assignmentId,
          finalPayRials: detail.finalPayRials,
          settlementTriggered: false,
        },
      });
    });

    publishRealtimeEvent("assignment", detail.assignmentId, "timesheet.updated", {
      timesheetId,
      status: "APPROVED",
    });
    publishRealtimeEvent("shift", detail.shiftId, "timesheet.updated", {
      timesheetId,
      status: "APPROVED",
    });
    publishRealtimeEvent("user", detail.workerId, "timesheet.updated", {
      timesheetId,
      status: "APPROVED",
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
    if (detail.status === "APPROVED") {
      throw new AppError("تایم‌شیت تأییدشده مستقیماً قابل اختلاف نیست.", "CONFLICT", 409);
    }

    await db.transaction(async (tx) => {
      await tx
        .update(timesheets)
        .set({ status: "DISPUTED" })
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

    publishRealtimeEvent("assignment", detail.assignmentId, "timesheet.updated", {
      timesheetId,
      status: "DISPUTED",
    });
    publishRealtimeEvent("shift", detail.shiftId, "timesheet.updated", {
      timesheetId,
      status: "DISPUTED",
    });

    return this.getByIdInternal(timesheetId);
  }
}
