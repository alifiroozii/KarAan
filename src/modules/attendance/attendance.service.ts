import { db } from "@/db";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { attendanceEvents, timesheets } from "@/db/schema/attendance";
import { eq } from "drizzle-orm";
import { calculateDistanceKm } from "@/lib/maps/distance";
import { AppError } from "@/lib/errors";

export class AttendanceService {
  /**
   * Geofenced Check-in for assigned Shift Worker
   */
  async checkInWorker(assignmentId: string, currentLat: number, currentLng: number) {
    const [assignment] = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    }

    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    if (!shift) {
      throw new AppError("اطلاعات شیفت پیدا نشد.", "NOT_FOUND", 404);
    }

    // Geofence Radius Verification
    const distanceKm = calculateDistanceKm(
      shift.latitude,
      shift.longitude,
      currentLat,
      currentLng
    );
    const maxRadiusKm = (shift.geofenceRadiusMeters || 100) / 1000;

    if (distanceKm > maxRadiusKm) {
      throw new AppError(
        `شما خارج از شعبه محل شیفت هستید (${Math.round(distanceKm * 1000)} متر فاصله). ورود ثبت نشد.`,
        "FORBIDDEN",
        400,
        { distanceMeters: Math.round(distanceKm * 1000), maxRadiusMeters: shift.geofenceRadiusMeters }
      );
    }

    const now = new Date();

    // Insert Attendance Event
    const eventId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(attendanceEvents).values({
      id: eventId,
      assignmentId: assignment.id,
      eventType: "CHECK_IN",
      timestamp: now,
      latitude: currentLat,
      longitude: currentLng,
      isWithinGeofence: true,
    });

    // Update assignment state to CHECKED_IN
    await db
      .update(shiftAssignments)
      .set({
        state: "CHECKED_IN",
        checkedInAt: now,
        updatedAt: now,
      })
      .where(eq(shiftAssignments.id, assignment.id));

    return {
      assignmentId: assignment.id,
      state: "CHECKED_IN",
      checkedInAt: now,
      distanceMeters: Math.round(distanceKm * 1000),
    };
  }

  /**
   * Geofenced Check-out & Automated Timesheet Generation
   */
  async checkOutWorker(assignmentId: string, currentLat: number, currentLng: number) {
    const [assignment] = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    }

    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    const now = new Date();
    const checkedInAt = assignment.checkedInAt || new Date(now.getTime() - 4 * 3600 * 1000);

    // Calculate worked duration in hours
    const workedDurationMs = now.getTime() - checkedInAt.getTime();
    const breakMinutes = assignment.totalBreakMinutes || 0;
    const netWorkedHours = Math.max(
      0.5,
      (workedDurationMs - breakMinutes * 60 * 1000) / (3600 * 1000)
    );

    const hourlyRateRials = shift ? shift.hourlyPayRials : BigInt(1500000);
    const calculatedPayRials = BigInt(Math.round(netWorkedHours)) * hourlyRateRials;

    // Insert Attendance Check-out Event
    const eventId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(attendanceEvents).values({
      id: eventId,
      assignmentId: assignment.id,
      eventType: "CHECK_OUT",
      timestamp: now,
      latitude: currentLat,
      longitude: currentLng,
      isWithinGeofence: true,
    });

    // Create Timesheet Record for Employer Approval
    const timesheetId = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const grossMinutes = Math.round((workedDurationMs) / (60 * 1000));
    const netWorkedMinutes = Math.max(30, grossMinutes - breakMinutes);

    await db.insert(timesheets).values({
      id: timesheetId,
      assignmentId: assignment.id,
      grossMinutes,
      breakMinutes,
      netWorkedMinutes,
      calculatedPayRials,
      finalPayRials: calculatedPayRials,
      status: "SUBMITTED",
    });

    // Update Assignment state to COMPLETED
    await db
      .update(shiftAssignments)
      .set({
        state: "COMPLETED",
        checkedOutAt: now,
        actualPayRials: calculatedPayRials,
        updatedAt: now,
      })
      .where(eq(shiftAssignments.id, assignment.id));

    return {
      assignmentId: assignment.id,
      timesheetId,
      state: "COMPLETED",
      checkedOutAt: now,
      netWorkedHours,
      calculatedPayRials,
    };
  }
}
