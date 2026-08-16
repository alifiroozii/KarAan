import crypto from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { attendanceEvents, timesheets } from "@/db/schema/attendance";
import { auditLogs } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { getMapAdapter } from "@/infrastructure/map";
import { AppError } from "@/lib/errors";
import { calculateHourlyShiftPay } from "@/lib/money";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";

export class AttendanceService {
  private mapAdapter = getMapAdapter();

  async checkInWorker(
    assignmentId: string,
    workerUserId: string,
    currentLat: number,
    currentLng: number
  ) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("شما مجوز ثبت ورود این شیفت را ندارید.", "FORBIDDEN", 403);
    }

    if (row.assignment.state === "CHECKED_IN") {
      return {
        assignmentId,
        state: "CHECKED_IN" as const,
        checkedInAt: row.assignment.checkedInAt,
        idempotent: true,
      };
    }

    AssignmentStateMachine.assertCanTransition(row.assignment.state, "CHECKED_IN");

    const distanceMeters = this.mapAdapter.calculateDistanceMeters(
      { latitude: currentLat, longitude: currentLng },
      { latitude: row.shift.latitude, longitude: row.shift.longitude }
    );

    if (distanceMeters > row.shift.geofenceRadiusMeters) {
      throw new AppError(
        `شما خارج از محدوده محل شیفت هستید (${Math.round(distanceMeters)} متر فاصله).`,
        "OUTSIDE_GEOFENCE",
        400,
        { distanceMeters, maxRadiusMeters: row.shift.geofenceRadiusMeters }
      );
    }

    const now = new Date();
    const eventId = `att_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      const updated = await tx
        .update(shiftAssignments)
        .set({ state: "CHECKED_IN", checkedInAt: now, updatedAt: now })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            eq(shiftAssignments.state, "ARRIVED")
          )
        )
        .returning({ id: shiftAssignments.id });

      if (updated.length !== 1) {
        throw new AppError(
          "وضعیت شیفت تغییر کرده است. دوباره تلاش کنید.",
          "INVALID_STATE_TRANSITION",
          409
        );
      }

      await tx.insert(attendanceEvents).values({
        id: eventId,
        assignmentId,
        eventType: "CHECK_IN",
        timestamp: now,
        latitude: currentLat,
        longitude: currentLng,
        isWithinGeofence: true,
        distanceFromTargetMeters: distanceMeters,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "CHECK_IN",
        details: { eventId, latitude: currentLat, longitude: currentLng, distanceMeters },
      });
    });

    publishRealtimeEvent("assignment", assignmentId, "worker.checked_in", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
      checkedInAt: now.toISOString(),
    });
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      state: "CHECKED_IN",
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("shift", row.shift.id, "assignment.updated", {
      assignmentId,
      state: "CHECKED_IN",
      shiftId: row.shift.id,
    });

    return { assignmentId, state: "CHECKED_IN" as const, checkedInAt: now, distanceMeters };
  }

  async checkOutWorker(
    assignmentId: string,
    workerUserId: string,
    currentLat: number,
    currentLng: number
  ) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("شما مجوز ثبت خروج این شیفت را ندارید.", "FORBIDDEN", 403);
    }

    if (row.assignment.state === "CHECKED_OUT" || row.assignment.state === "COMPLETED") {
      const [existingTimesheet] = await db
        .select({ id: timesheets.id })
        .from(timesheets)
        .where(eq(timesheets.assignmentId, assignmentId))
        .limit(1);
      return {
        assignmentId,
        state: row.assignment.state,
        checkedOutAt: row.assignment.checkedOutAt,
        timesheetId: existingTimesheet?.id ?? null,
        idempotent: true,
      };
    }

    AssignmentStateMachine.assertCanTransition(row.assignment.state, "CHECKED_OUT");
    if (!row.assignment.checkedInAt) {
      throw new AppError("زمان ورود ثبت نشده است.", "MISSING_CHECK_IN", 400);
    }

    const distanceMeters = this.mapAdapter.calculateDistanceMeters(
      { latitude: currentLat, longitude: currentLng },
      { latitude: row.shift.latitude, longitude: row.shift.longitude }
    );
    if (distanceMeters > row.shift.geofenceRadiusMeters) {
      throw new AppError("ثبت خروج خارج از محدوده مجاز است.", "OUTSIDE_GEOFENCE", 400, {
        distanceMeters,
        maxRadiusMeters: row.shift.geofenceRadiusMeters,
      });
    }

    const now = new Date();
    const grossMinutes = Math.max(
      0,
      Math.floor((now.getTime() - new Date(row.assignment.checkedInAt).getTime()) / 60000)
    );
    const breakMinutes = row.assignment.totalBreakMinutes || 0;
    const netWorkedMinutes = Math.max(0, grossMinutes - breakMinutes);
    const calculatedPayRials = calculateHourlyShiftPay(row.shift.hourlyPayRials, netWorkedMinutes);
    const eventId = `att_${crypto.randomUUID()}`;
    let finalTimesheetId = `ts_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      const updated = await tx
        .update(shiftAssignments)
        .set({
          state: "CHECKED_OUT",
          checkedOutAt: now,
          actualPayRials: calculatedPayRials,
          updatedAt: now,
        })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            inArray(shiftAssignments.state, ["CHECKED_IN", "ON_BREAK"])
          )
        )
        .returning({ id: shiftAssignments.id });

      if (updated.length !== 1) {
        throw new AppError("ثبت خروج انجام نشد؛ وضعیت شیفت تغییر کرده است.", "CHECK_OUT_FAILED", 409);
      }

      await tx.insert(attendanceEvents).values({
        id: eventId,
        assignmentId,
        eventType: "CHECK_OUT",
        timestamp: now,
        latitude: currentLat,
        longitude: currentLng,
        isWithinGeofence: true,
        distanceFromTargetMeters: distanceMeters,
      });

      const [existingTimesheet] = await tx
        .select({ id: timesheets.id })
        .from(timesheets)
        .where(eq(timesheets.assignmentId, assignmentId))
        .limit(1);

      if (existingTimesheet) {
        finalTimesheetId = existingTimesheet.id;
      } else {
        await tx.insert(timesheets).values({
          id: finalTimesheetId,
          assignmentId,
          grossMinutes,
          breakMinutes,
          netWorkedMinutes,
          calculatedPayRials,
          finalPayRials: calculatedPayRials,
          status: "SUBMITTED",
        });
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "CHECK_OUT",
        details: {
          eventId,
          timesheetId: finalTimesheetId,
          latitude: currentLat,
          longitude: currentLng,
          distanceMeters,
          netWorkedMinutes,
          calculatedPayRials: calculatedPayRials.toString(),
        },
      });
    });

    publishRealtimeEvent("assignment", assignmentId, "worker.checked_out", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
      checkedOutAt: now.toISOString(),
    });
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      state: "CHECKED_OUT",
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("shift", row.shift.id, "assignment.updated", {
      assignmentId,
      state: "CHECKED_OUT",
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("assignment", assignmentId, "timesheet.updated", {
      timesheetId: finalTimesheetId,
      status: "SUBMITTED",
    });

    return {
      assignmentId,
      state: "CHECKED_OUT" as const,
      checkedOutAt: now,
      timesheetId: finalTimesheetId,
      netWorkedMinutes,
      calculatedPayRials,
    };
  }
}
