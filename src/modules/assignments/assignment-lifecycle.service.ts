import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { locationEvents } from "@/db/schema/attendance";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { getMapAdapter } from "@/infrastructure/map";
import {
  getAssignmentEta,
  setAssignmentEta,
  updateWorkerOnlineLocation,
} from "@/infrastructure/redis/redis-client";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { LocationTrackingService } from "@/modules/location/location-tracking.service";
import { evaluateArrivalEvidence } from "./arrival-policy";
import { AssignmentStateMachine } from "./assignment.state-machine";

export type LateRisk = "ON_TIME" | "RISK_OF_LATE" | "LATE";

export interface AssignmentEtaSnapshot {
  distanceMeters: number;
  durationSeconds: number;
  estimatedArrivalAt: string;
  calculatedAt: string;
  lateRisk: LateRisk;
}

export interface ArrivalInput {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export class AssignmentLifecycleService {
  private mapAdapter = getMapAdapter();
  private locationService = new LocationTrackingService();

  private async readNumericSetting(
    key: string,
    fallback: number,
    property: "minutes" | "meters"
  ): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
    if (raw && typeof raw === "object" && property in raw) {
      const value = Number((raw as Record<string, unknown>)[property]);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    return fallback;
  }

  private getLateGraceMinutes(): Promise<number> {
    return this.readNumericSetting("shift.late_grace_minutes", 10, "minutes");
  }

  private getMaxLocationAccuracyMeters(): Promise<number> {
    return this.readNumericSetting("location.max_accuracy_meters", 80, "meters");
  }

  private computeLateRisk(
    now: Date,
    estimatedArrivalAt: Date,
    shiftStartAt: Date,
    graceMinutes: number
  ): LateRisk {
    const graceAt = shiftStartAt.getTime() + graceMinutes * 60_000;
    if (now.getTime() > graceAt) return "LATE";
    if (estimatedArrivalAt.getTime() > graceAt) return "RISK_OF_LATE";
    return "ON_TIME";
  }

  private async calculateEta(
    workerId: string,
    shift: { latitude: number; longitude: number; startAt: Date }
  ): Promise<AssignmentEtaSnapshot> {
    const currentLocation = await this.locationService.getCurrentWorkerLocation(workerId);
    if (!currentLocation) {
      throw new AppError(
        "برای اعلام حرکت، ابتدا دسترسی موقعیت مکانی را فعال کنید.",
        "LOCATION_UNAVAILABLE",
        400
      );
    }

    const eta = await this.mapAdapter.getEstimatedArrival(currentLocation, {
      latitude: shift.latitude,
      longitude: shift.longitude,
    });

    const now = new Date();
    const estimatedArrivalAt = new Date(now.getTime() + eta.durationSeconds * 1000);
    const graceMinutes = await this.getLateGraceMinutes();
    const lateRisk = this.computeLateRisk(now, estimatedArrivalAt, shift.startAt, graceMinutes);

    return {
      distanceMeters: eta.distanceMeters,
      durationSeconds: eta.durationSeconds,
      estimatedArrivalAt: estimatedArrivalAt.toISOString(),
      calculatedAt: now.toISOString(),
      lateRisk,
    };
  }

  private publishEta(
    shiftId: string,
    assignmentId: string,
    workerId: string,
    eta: AssignmentEtaSnapshot
  ) {
    const payload = {
      assignmentId,
      workerId,
      shiftId,
      distanceMeters: eta.distanceMeters,
      durationSeconds: eta.durationSeconds,
      estimatedArrivalAt: eta.estimatedArrivalAt,
      lateRisk: eta.lateRisk,
    };

    publishRealtimeEvent("assignment", assignmentId, "worker.en_route", payload);
    publishRealtimeEvent("shift", shiftId, "worker.en_route", payload);

    if (eta.lateRisk !== "ON_TIME") {
      const latePayload = {
        assignmentId,
        workerId,
        shiftId,
        lateRisk: eta.lateRisk,
        estimatedArrivalAt: eta.estimatedArrivalAt,
      } as const;
      publishRealtimeEvent("assignment", assignmentId, "worker.late_risk", latePayload);
      publishRealtimeEvent("shift", shiftId, "worker.late_risk", latePayload);
    }
  }

  async markEnRoute(assignmentId: string, workerUserId: string) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("شما مالک این شیفت نیستید.", "FORBIDDEN", 403);
    }

    if (row.assignment.state === "EN_ROUTE") {
      const cachedEta = await getAssignmentEta(assignmentId);
      return {
        assignmentId,
        state: "EN_ROUTE" as const,
        eta: cachedEta,
        idempotent: true,
      };
    }

    AssignmentStateMachine.assertCanTransition(row.assignment.state, "EN_ROUTE");
    const eta = await this.calculateEta(row.assignment.workerId, row.shift);
    const now = new Date();

    await db.transaction(async (tx) => {
      const updated = await tx
        .update(shiftAssignments)
        .set({ state: "EN_ROUTE", updatedAt: now })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            eq(shiftAssignments.state, "CONFIRMED")
          )
        )
        .returning({ id: shiftAssignments.id });

      if (updated.length !== 1) {
        throw new AppError(
          "وضعیت شیفت تغییر کرده است. صفحه را به‌روزرسانی کنید.",
          "INVALID_STATE_TRANSITION",
          409
        );
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "EN_ROUTE",
        details: { ...eta },
      });
    });

    await setAssignmentEta(assignmentId, eta);
    this.publishEta(row.shift.id, assignmentId, workerUserId, eta);
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      state: "EN_ROUTE",
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("shift", row.shift.id, "assignment.updated", {
      assignmentId,
      state: "EN_ROUTE",
      shiftId: row.shift.id,
    });

    return { assignmentId, state: "EN_ROUTE" as const, eta };
  }

  async refreshEta(assignmentId: string, workerUserId: string) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("دسترسی به ETA این شیفت مجاز نیست.", "FORBIDDEN", 403);
    }
    if (row.assignment.state !== "EN_ROUTE") {
      throw new AppError(
        "ETA فقط برای نیروی در مسیر محاسبه می‌شود.",
        "INVALID_ASSIGNMENT_STATE",
        400
      );
    }

    const eta = await this.calculateEta(row.assignment.workerId, row.shift);
    await setAssignmentEta(assignmentId, eta);
    this.publishEta(row.shift.id, assignmentId, workerUserId, eta);

    return { assignmentId, eta };
  }

  async markArrived(
    assignmentId: string,
    workerUserId: string,
    input: ArrivalInput
  ) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== workerUserId) {
      throw new AppError("شما مالک این شیفت نیستید.", "FORBIDDEN", 403);
    }

    const distanceMeters = this.mapAdapter.calculateDistanceMeters(
      { latitude: input.latitude, longitude: input.longitude },
      { latitude: row.shift.latitude, longitude: row.shift.longitude }
    );
    const maxAccuracyMeters = await this.getMaxLocationAccuracyMeters();

    if (row.assignment.state === "ARRIVED") {
      return {
        assignmentId,
        state: "ARRIVED" as const,
        distanceMeters,
        geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
        accuracyMeters: input.accuracyMeters,
        idempotent: true,
      };
    }

    AssignmentStateMachine.assertCanTransition(row.assignment.state, "ARRIVED");

    const evaluation = evaluateArrivalEvidence({
      accuracyMeters: input.accuracyMeters,
      maxAccuracyMeters,
      distanceMeters,
      geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
    });

    if (!evaluation.accepted && evaluation.reason === "LOW_LOCATION_ACCURACY") {
      throw new AppError(
        "دقت GPS برای ثبت رسیدن کافی نیست. چند لحظه در فضای باز تلاش کنید.",
        "LOW_LOCATION_ACCURACY",
        400,
        { accuracyMeters: input.accuracyMeters, maxAccuracyMeters }
      );
    }

    if (!evaluation.accepted) {
      throw new AppError(
        `هنوز ${Math.round(distanceMeters)} متر با محدوده محل شیفت فاصله دارید.`,
        "OUTSIDE_GEOFENCE",
        400,
        {
          distanceMeters,
          geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
        }
      );
    }

    const now = new Date();
    const locationEventId = `loc_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      const updated = await tx
        .update(shiftAssignments)
        .set({ state: "ARRIVED", updatedAt: now })
        .where(
          and(
            eq(shiftAssignments.id, assignmentId),
            eq(shiftAssignments.state, "EN_ROUTE")
          )
        )
        .returning({ id: shiftAssignments.id });

      if (updated.length !== 1) {
        throw new AppError(
          "وضعیت شیفت تغییر کرده است. صفحه را به‌روزرسانی کنید.",
          "INVALID_STATE_TRANSITION",
          409
        );
      }

      await tx.insert(locationEvents).values({
        id: locationEventId,
        workerId: workerUserId,
        assignmentId,
        latitude: input.latitude,
        longitude: input.longitude,
        timestamp: now,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerUserId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "ARRIVED",
        details: {
          locationEventId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyMeters: input.accuracyMeters,
          maxAccuracyMeters,
          distanceMeters,
          geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
        },
      });
    });

    await updateWorkerOnlineLocation(workerUserId, input.latitude, input.longitude);

    publishRealtimeEvent("assignment", assignmentId, "worker.arrived", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("shift", row.shift.id, "worker.arrived", {
      assignmentId,
      workerId: workerUserId,
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      state: "ARRIVED",
      shiftId: row.shift.id,
    });
    publishRealtimeEvent("shift", row.shift.id, "assignment.updated", {
      assignmentId,
      state: "ARRIVED",
      shiftId: row.shift.id,
    });

    return {
      assignmentId,
      state: "ARRIVED" as const,
      arrivedAt: now,
      distanceMeters,
      geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
      accuracyMeters: input.accuracyMeters,
    };
  }
}
