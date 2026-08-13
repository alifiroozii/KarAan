import { db } from "@/db";
import { shiftAssignments, shifts, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMapAdapter } from "@/infrastructure/map";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";
import { calculateHourlyShiftPay } from "@/lib/money";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export class TimesheetService {
  private mapAdapter = getMapAdapter();

  async checkInWorker(
    assignmentId: string,
    workerUserId: string,
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean; isGeofenceValid: boolean; checkedInAt: Date }> {
    const assignmentList = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (assignmentList.length === 0) {
      throw new AppError("شیفت یافت نشد.", "NOT_FOUND", 404);
    }

    const assignment = assignmentList[0];

    if (assignment.workerId !== workerUserId) {
      throw new AppError("شما مجوز ثبت ورود برای این شیفت را ندارید.", "FORBIDDEN", 403);
    }

    // Verify state transition: ARRIVED -> CHECKED_IN
    AssignmentStateMachine.assertCanTransition(assignment.state, "CHECKED_IN");

    const shiftList = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    const shift = shiftList[0];

    // Validate GPS geofence
    const isGeofenceValid = this.mapAdapter.isWithinGeofence(
      { latitude, longitude },
      { latitude: shift.latitude, longitude: shift.longitude },
      shift.geofenceRadiusMeters
    );

    if (!isGeofenceValid) {
      console.warn(
        `[Geofence Warning] Worker ${workerUserId} checked in outside radius of shift ${shift.id}`
      );
    }

    const now = new Date();

    await db
      .update(shiftAssignments)
      .set({
        state: "CHECKED_IN",
        checkedInAt: now,
        updatedAt: now,
      })
      .where(eq(shiftAssignments.id, assignmentId));

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: workerUserId,
      entityName: "shift_assignment",
      entityId: assignmentId,
      action: "CHECK_IN",
      details: { latitude, longitude, isGeofenceValid },
    });

    return { success: true, isGeofenceValid, checkedInAt: now };
  }

  async checkOutWorker(
    assignmentId: string,
    workerUserId: string,
    latitude: number,
    longitude: number,
    breakMinutes = 0
  ): Promise<{
    success: boolean;
    actualPayRials: bigint;
    totalWorkedMinutes: number;
  }> {
    const assignmentList = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (assignmentList.length === 0) {
      throw new AppError("شیفت یافت نشد.", "NOT_FOUND", 404);
    }

    const assignment = assignmentList[0];

    if (assignment.workerId !== workerUserId) {
      throw new AppError("شما مجوز ثبت خروج برای این شیفت را ندارید.", "FORBIDDEN", 403);
    }

    if (!assignment.checkedInAt) {
      throw new AppError("زمان ورود ثبت نشده است.", "BAD_REQUEST", 400);
    }

    const shiftList = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    const shift = shiftList[0];
    const now = new Date();

    // Calculate duration in minutes
    const totalMs = now.getTime() - new Date(assignment.checkedInAt).getTime();
    const grossMinutes = Math.max(0, Math.floor(totalMs / 60000));
    const netWorkedMinutes = Math.max(0, grossMinutes - breakMinutes);

    // Calculate actual pay
    const actualPayRials = calculateHourlyShiftPay(
      shift.hourlyPayRials,
      netWorkedMinutes
    );

    await db
      .update(shiftAssignments)
      .set({
        state: "TIMESHEET_SUBMITTED",
        checkedOutAt: now,
        totalBreakMinutes: breakMinutes,
        actualPayRials,
        updatedAt: now,
      })
      .where(eq(shiftAssignments.id, assignmentId));

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: workerUserId,
      entityName: "shift_assignment",
      entityId: assignmentId,
      action: "TIMESHEET_SUBMITTED",
      details: {
        latitude,
        longitude,
        netWorkedMinutes,
        actualPayRials: actualPayRials.toString(),
      },
    });

    return {
      success: true,
      actualPayRials,
      totalWorkedMinutes: netWorkedMinutes,
    };
  }
}
