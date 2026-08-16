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
  accuracyMeters?: number;
}

type StartBreakResult = {
  breakId: string;
  state: "ON_BREAK";
  startedAt: Date;
  idempotent?: boolean;
  paid?: boolean;
  allowedMinutes?: number;
};

type EndBreakResult = {
  breakId: string | null;
  state: "CHECKED_IN";
  endedAt?: Date;
  durationMinutes?: number;
  totalBreakMinutes?: number;
  exceededAllowedMinutes?: boolean;
  idempotent?: boolean;
};

export class BreakService {
  private mapAdapter = getMapAdapter();

  private async readPositiveIntegerSetting(
    key: string,
    property: "count" | "minutes",
    fallback: number
  ): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.max(1, Math.floor(raw));
    }
    if (raw && typeof raw === "object" && property in raw) {
      const value = Number((raw as Record<string, unknown>)[property]);
      if (Number.isFinite(value)) return Math.max(1, Math.floor(value));
    }
    return fallback;
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

  async startBreak(
    assignmentId: string,
    workerUserId: string,
    location: BreakLocation
  ) {
    const row = await this.loadAssignment(assignmentId);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
    }

    const [maxBreakCount, maxTotalBreakMinutes] = await Promise.all([
      this.readPositiveIntegerSetting("break.max_count", "count", 3),
      this.readPositiveIntegerSetting(
        "break.max_total_minutes",
        "minutes",
        Math.max(1, row.shift.breakDurationMinutes)
      ),
    ]);

    let result: StartBreakResult | null = null;
    let shouldPublish = false;
    let distanceMeters = 0;
    let withinGeofence = false;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`break:${assignmentId}`}))`
      );

      const [freshAssignment] = await tx
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, assignmentId))
        .limit(1);
      if (!freshAssignment) {
        throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
      }
      if (freshAssignment.workerId !== workerUserId) {
        throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
      }

      const [activeBreak] = await tx
        .select()
        .from(breaks)
        .where(and(eq(breaks.assignmentId, assignmentId), isNull(breaks.endAt)))
        .orderBy(desc(breaks.startAt))
        .limit(1);

      if (freshAssignment.state === "ON_BREAK" && activeBreak) {
        result = {
          breakId: activeBreak.id,
          state: "ON_BREAK",
          startedAt: activeBreak.startAt,
          idempotent: true,
        };
        return;
      }

      AssignmentStateMachine.assertCanTransition(freshAssignment.state, "ON_BREAK");
      if (activeBreak) {
        throw new AppError("یک استراحت فعال از قبل وجود دارد.", "CONFLICT", 409);
      }

      const history = await tx
        .select({ id: breaks.id })
        .from(breaks)
        .where(eq(breaks.assignmentId, assignmentId));
      if (history.length >= maxBreakCount) {
        throw new AppError(
          `حداکثر تعداد استراحت این شیفت (${maxBreakCount.toLocaleString("fa-IR")}) استفاده شده است.`,
          "BAD_REQUEST",
          400,
          { maxBreakCount }
        );
      }

      distanceMeters = this.mapAdapter.calculateDistanceMeters(location, {
        latitude: row.shift.latitude,
        longitude: row.shift.longitude,
      });
      withinGeofence = distanceMeters <= row.shift.geofenceRadiusMeters;
      const now = new Date();
      const breakId = `brk_${crypto.randomUUID()}`;
      const eventId = `att_${crypto.randomUUID()}`;

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
        details: {
          breakId,
          eventId,
          distanceMeters,
          withinGeofence,
          accuracyMeters: location.accuracyMeters ?? null,
          maxBreakCount,
          maxTotalBreakMinutes,
        },
      });

      result = {
        breakId,
        state: "ON_BREAK",
        startedAt: now,
        paid: Boolean(row.shift.isPaidBreak),
        allowedMinutes: maxTotalBreakMinutes,
      };
      shouldPublish = true;
    });

    const finalResult = result as StartBreakResult | null;
    if (!finalResult) {
      throw new AppError("شروع استراحت ثبت نشد.", "INTERNAL_SERVER_ERROR", 500);
    }
    if (shouldPublish) {
      const payload = {
        assignmentId,
        workerId: workerUserId,
        shiftId: row.shift.id,
        breakId: finalResult.breakId,
        startedAt: finalResult.startedAt.toISOString(),
      };
      publishRealtimeEvent("assignment", assignmentId, "worker.break_started", payload);
      publishRealtimeEvent("shift", row.shift.id, "worker.break_started", payload);
      publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
        assignmentId,
        shiftId: row.shift.id,
        state: "ON_BREAK",
      });
    }

    return finalResult;
  }

  async endBreak(
    assignmentId: string,
    workerUserId: string,
    location: BreakLocation
  ) {
    const row = await this.loadAssignment(assignmentId);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
    }

    const maxTotalBreakMinutes = await this.readPositiveIntegerSetting(
      "break.max_total_minutes",
      "minutes",
      Math.max(1, row.shift.breakDurationMinutes)
    );

    let result: EndBreakResult | null = null;
    let eventPayload:
      | {
          assignmentId: string;
          workerId: string;
          shiftId: string;
          breakId: string;
          endedAt: string;
          durationMinutes: number;
        }
      | null = null;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`break:${assignmentId}`}))`
      );

      const [freshAssignment] = await tx
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, assignmentId))
        .limit(1);
      if (!freshAssignment) {
        throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
      }
      if (freshAssignment.workerId !== workerUserId) {
        throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
      }

      const [activeBreak] = await tx
        .select()
        .from(breaks)
        .where(and(eq(breaks.assignmentId, assignmentId), isNull(breaks.endAt)))
        .orderBy(desc(breaks.startAt))
        .limit(1);

      if (freshAssignment.state === "CHECKED_IN" && !activeBreak) {
        result = { breakId: null, state: "CHECKED_IN", idempotent: true };
        return;
      }
      if (!activeBreak) {
        throw new AppError("استراحت فعالی وجود ندارد.", "BAD_REQUEST", 400);
      }

      AssignmentStateMachine.assertCanTransition(freshAssignment.state, "CHECKED_IN");
      const now = new Date();
      const durationMinutes = Math.max(
        0,
        Math.floor((now.getTime() - activeBreak.startAt.getTime()) / 60_000)
      );
      const totalBreakMinutes = freshAssignment.totalBreakMinutes + durationMinutes;
      const distanceMeters = this.mapAdapter.calculateDistanceMeters(location, {
        latitude: row.shift.latitude,
        longitude: row.shift.longitude,
      });
      const withinGeofence = distanceMeters <= row.shift.geofenceRadiusMeters;
      const eventId = `att_${crypto.randomUUID()}`;

      const closed = await tx
        .update(breaks)
        .set({ endAt: now, durationMinutes })
        .where(and(eq(breaks.id, activeBreak.id), isNull(breaks.endAt)))
        .returning({ id: breaks.id });
      if (closed.length !== 1) {
        throw new AppError("استراحت همزمان تغییر کرده است.", "CONFLICT", 409);
      }

      const updated = await tx
        .update(shiftAssignments)
        .set({
          state: "CHECKED_IN",
          totalBreakMinutes,
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

      const exceededAllowedMinutes = totalBreakMinutes > maxTotalBreakMinutes;
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
          totalBreakMinutes,
          maxTotalBreakMinutes,
          exceededAllowedMinutes,
          accuracyMeters: location.accuracyMeters ?? null,
        },
      });

      result = {
        breakId: activeBreak.id,
        state: "CHECKED_IN",
        endedAt: now,
        durationMinutes,
        totalBreakMinutes,
        exceededAllowedMinutes,
      };
      eventPayload = {
        assignmentId,
        workerId: workerUserId,
        shiftId: row.shift.id,
        breakId: activeBreak.id,
        endedAt: now.toISOString(),
        durationMinutes,
      };
    });

    const finalResult = result as EndBreakResult | null;
    if (!finalResult) {
      throw new AppError("پایان استراحت ثبت نشد.", "INTERNAL_SERVER_ERROR", 500);
    }
    if (eventPayload) {
      publishRealtimeEvent("assignment", assignmentId, "worker.break_ended", eventPayload);
      publishRealtimeEvent("shift", row.shift.id, "worker.break_ended", eventPayload);
      publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
        assignmentId,
        shiftId: row.shift.id,
        state: "CHECKED_IN",
      });
      if (finalResult.exceededAllowedMinutes) {
        const warning = {
          assignmentId,
          workerId: workerUserId,
          shiftId: row.shift.id,
          usedMinutes: finalResult.totalBreakMinutes ?? 0,
          allowedMinutes: maxTotalBreakMinutes,
        };
        publishRealtimeEvent("assignment", assignmentId, "worker.break_limit_warning", warning);
        publishRealtimeEvent("shift", row.shift.id, "worker.break_limit_warning", warning);
      }
    }

    return finalResult;
  }
}
