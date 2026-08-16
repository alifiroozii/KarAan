import crypto from "crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendanceEvents, breaks } from "@/db/schema/attendance";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { getMapAdapter } from "@/infrastructure/map";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";

interface BreakLocation {
  latitude: number;
  longitude: number;
}

export class BreakService {
  private mapAdapter = getMapAdapter();

  private async readMaxBreakCount(): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, "break.max_count"))
      .limit(1);
    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
    if (raw && typeof raw === "object" && "count" in raw) {
      const count = Number((raw as Record<string, unknown>).count);
      if (Number.isFinite(count)) return Math.max(1, Math.floor(count));
    }
    return 3;
  }

  async startBreak(
    assignmentId: string,
    workerUserId: string,
    location: BreakLocation
  ) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
    }

    const [activeBreak] = await db
      .select()
      .from(breaks)
      .where(and(eq(breaks.assignmentId, assignmentId), isNull(breaks.endAt)))
      .orderBy(desc(breaks.startAt))
      .limit(1);

    if (row.assignment.state === "ON_BREAK" && activeBreak) {
      return {
        breakId: activeBreak.id,
        state: "ON_BREAK" as const,
        startedAt: activeBreak.startAt,
        idempotent: true,
      };
    }

    AssignmentStateMachine.assertCanTransition(row.assignment.state, "ON_BREAK");
    if (activeBreak) {
      throw new AppError("یک استراحت فعال از قبل وجود دارد.", "ACTIVE_BREAK_EXISTS", 409);
    }

    const history = await db
      .select({ id: breaks.id })
      .from(breaks)
      .where(eq(breaks.assignmentId, assignmentId));
    const maxBreakCount = await this.readMaxBreakCount();
    if (history.length >= maxBreakCount) {
      throw new AppError(
        `حداکثر تعداد استراحت این شیفت (${maxBreakCount.toLocaleString("fa-IR")}) استفاده شده است.`,
        "BAD_REQUEST",
        400,
        { maxBreakCount }
      );
    }

    const distanceMeters = this.mapAdapter.calculateDistanceMeters(
      location,
      { latitude: row.shift.latitude, longitude: row.shift.longitude }
    );
    const withinGeofence = distanceMeters <= row.shift.geofenceRadiusMeters;
    const now = new Date();
    const breakId = `brk_${crypto.randomUUID()}`;
    const eventId = `att_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`break:${assignmentId}`}))`
      );

      const updated = await tx
        .update(shiftAssignments)
        .set({ state: "ON_BREAK", updatedAt: now })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            eq(shiftAssignments.state, "CHECKED_IN")
          )
        )
        .returning({ id: shiftAssignments.id });
      if (updated.length !== 1) {
        throw new AppError("وضعیت شیفت برای شروع استراحت تغییر کرده است.", "CONFLICT", 409);
      }

      await tx.insert(breaks).values({
        id: breakId,
        assignmentId,
        startAt: now,
        durationMinutes: 0,
        isApproved: true,
      });

      await tx.insert(attendanceEvents).values({
        id: eventId,
        assignmentId,
        eventType: "BREAK_START",
        timestamp: now,
        latitude: location.latitude,
        longitude: location.longitude,
        isWithinGeofence: withinGeofence,
        distanceFromTargetMeters: distanceMeters,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "BREAK_STARTED",
        details: { breakId, eventId, distanceMeters, withinGeofence },
      });
    });

    publishRealtimeEvent("assignment", assignmentId, "worker.break_started", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
      breakId,
      startedAt: now.toISOString(),
    });
    publishRealtimeEvent("shift", row.shift.id, "worker.break_started", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
      breakId,
      startedAt: now.toISOString(),
    });
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      shiftId: row.shift.id,
      state: "ON_BREAK",
    });

    return {
      breakId,
      state: "ON_BREAK" as const,
      startedAt: now,
      paid: Boolean(row.shift.isPaidBreak),
      allowedMinutes: row.shift.breakDurationMinutes,
    };
  }

  async endBreak(
    assignmentId: string,
    workerUserId: string,
    location: BreakLocation
  ) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
    }

    const [activeBreak] = await db
      .select()
      .from(breaks)
      .where(and(eq(breaks.assignmentId, assignmentId), isNull(breaks.endAt)))
      .orderBy(desc(breaks.startAt))
      .limit(1);

    if (row.assignment.state === "CHECKED_IN" && !activeBreak) {
      return { state: "CHECKED_IN" as const, idempotent: true };
    }
    if (!activeBreak) {
      throw new AppError("استراحت فعالی وجود ندارد.", "BAD_REQUEST", 400);
    }

    AssignmentStateMachine.assertCanTransition(row.assignment.state, "CHECKED_IN");

    const now = new Date();
    const durationMinutes = Math.max(
      0,
      Math.floor((now.getTime() - activeBreak.startAt.getTime()) / 60_000)
    );
    const distanceMeters = this.mapAdapter.calculateDistanceMeters(
      location,
      { latitude: row.shift.latitude, longitude: row.shift.longitude }
    );
    const withinGeofence = distanceMeters <= row.shift.geofenceRadiusMeters;
    const eventId = `att_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`break:${assignmentId}`}))`
      );

      await tx
        .update(breaks)
        .set({ endAt: now, durationMinutes })
        .where(and(eq(breaks.id, activeBreak.id), isNull(breaks.endAt)));

      const updated = await tx
        .update(shiftAssignments)
        .set({
          state: "CHECKED_IN",
          totalBreakMinutes: sql`${shiftAssignments.totalBreakMinutes} + ${durationMinutes}`,
          updatedAt: now,
        })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            eq(shiftAssignments.state, "ON_BREAK")
          )
        )
        .returning({ id: shiftAssignments.id });
      if (updated.length !== 1) {
        throw new AppError("وضعیت شیفت برای پایان استراحت تغییر کرده است.", "CONFLICT", 409);
      }

      await tx.insert(attendanceEvents).values({
        id: eventId,
        assignmentId,
        eventType: "BREAK_END",
        timestamp: now,
        latitude: location.latitude,
        longitude: location.longitude,
        isWithinGeofence: withinGeofence,
        distanceFromTargetMeters: distanceMeters,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "BREAK_ENDED",
        details: {
          breakId: activeBreak.id,
          eventId,
          durationMinutes,
          exceededAllowedMinutes: durationMinutes > row.shift.breakDurationMinutes,
        },
      });
    });

    publishRealtimeEvent("assignment", assignmentId, "worker.break_ended", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
      breakId: activeBreak.id,
      endedAt: now.toISOString(),
      durationMinutes,
    });
    publishRealtimeEvent("shift", row.shift.id, "worker.break_ended", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
      breakId: activeBreak.id,
      endedAt: now.toISOString(),
      durationMinutes,
    });
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      shiftId: row.shift.id,
      state: "CHECKED_IN",
    });

    return {
      breakId: activeBreak.id,
      state: "CHECKED_IN" as const,
      endedAt: now,
      durationMinutes,
      exceededAllowedMinutes: durationMinutes > row.shift.breakDurationMinutes,
    };
  }
}
