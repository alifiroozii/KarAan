import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { getMapAdapter } from "@/infrastructure/map";
import {
  getAssignmentEta,
  setAssignmentEta,
} from "@/infrastructure/redis/redis-client";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { LocationTrackingService } from "@/modules/location/location-tracking.service";
import { AssignmentStateMachine } from "./assignment.state-machine";

export type LateRisk = "ON_TIME" | "RISK_OF_LATE" | "LATE";

export interface AssignmentEtaSnapshot {
  distanceMeters: number;
  durationSeconds: number;
  estimatedArrivalAt: string;
  calculatedAt: string;
  lateRisk: LateRisk;
}

export class AssignmentLifecycleService {
  private mapAdapter = getMapAdapter();
  private locationService = new LocationTrackingService();

  private async getLateGraceMinutes(): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, "shift.late_grace_minutes"))
      .limit(1);

    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
    if (raw && typeof raw === "object" && "minutes" in raw) {
      const minutes = Number((raw as Record<string, unknown>).minutes);
      if (Number.isFinite(minutes)) return Math.max(0, minutes);
    }
    return 10;
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
        details: eta,
      });
    });

    await setAssignmentEta(assignmentId, eta);

    publishRealtimeEvent("assignment", assignmentId, "worker.en_route", {
      assignmentId,
      workerId: workerUserId,
      distanceMeters: eta.distanceMeters,
      durationSeconds: eta.durationSeconds,
      estimatedArrivalAt: eta.estimatedArrivalAt,
      lateRisk: eta.lateRisk,
    });
    publishRealtimeEvent("assignment", assignmentId, "assignment.updated", {
      assignmentId,
      state: "EN_ROUTE",
    });
    publishRealtimeEvent("shift", row.shift.id, "assignment.updated", {
      assignmentId,
      state: "EN_ROUTE",
    });

    if (eta.lateRisk !== "ON_TIME") {
      publishRealtimeEvent("assignment", assignmentId, "worker.late_risk", {
        assignmentId,
        workerId: workerUserId,
        lateRisk: eta.lateRisk,
        estimatedArrivalAt: eta.estimatedArrivalAt,
      });
      publishRealtimeEvent("shift", row.shift.id, "worker.late_risk", {
        assignmentId,
        workerId: workerUserId,
        lateRisk: eta.lateRisk,
        estimatedArrivalAt: eta.estimatedArrivalAt,
      });
    }

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

    if (eta.lateRisk !== "ON_TIME") {
      publishRealtimeEvent("shift", row.shift.id, "worker.late_risk", {
        assignmentId,
        workerId: workerUserId,
        lateRisk: eta.lateRisk,
        estimatedArrivalAt: eta.estimatedArrivalAt,
      });
    }

    return { assignmentId, eta };
  }
}
