import { db } from "@/db";
import { locationEvents } from "@/db/schema/attendance";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { eq, and, inArray } from "drizzle-orm";
import {
  getWorkerOnlineLocation,
  updateWorkerOnlineLocation,
} from "@/infrastructure/redis/redis-client";
import { maskExactLocationToApproximate, isSignificantLocationChange } from "@/lib/location/privacy";
import { Coordinates } from "@/lib/maps/types";
import { AppError } from "@/lib/errors";

const lastWorkerPositions = new Map<
  string,
  { latitude: number; longitude: number; timestamp: number }
>();

export interface LocationUpdateOptions {
  workerId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  batteryLevel?: number;
  assignmentId?: string;
}

export class LocationTrackingService {
  private async assertTrackingAssignment(workerId: string, assignmentId?: string) {
    if (!assignmentId) return;

    const [assignment] = await db
      .select({ id: shiftAssignments.id, state: shiftAssignments.state })
      .from(shiftAssignments)
      .where(
        and(
          eq(shiftAssignments.id, assignmentId),
          eq(shiftAssignments.workerId, workerId)
        )
      )
      .limit(1);

    if (!assignment) {
      throw new AppError(
        "این انتساب متعلق به حساب شما نیست.",
        "FORBIDDEN",
        403
      );
    }

    if (!["EN_ROUTE", "ARRIVED", "CHECKED_IN", "ON_BREAK"].includes(assignment.state)) {
      throw new AppError(
        "ردیابی دقیق برای وضعیت فعلی شیفت مجاز نیست.",
        "INVALID_ASSIGNMENT_STATE",
        400,
        { state: assignment.state }
      );
    }
  }

  async updateWorkerLocation(options: LocationUpdateOptions) {
    const { workerId, latitude, longitude, speed, batteryLevel, assignmentId } = options;
    await this.assertTrackingAssignment(workerId, assignmentId);

    const now = Date.now();
    const lastPos = lastWorkerPositions.get(workerId);

    const isEnRoute = Boolean(assignmentId);
    const minDistanceMeters = isEnRoute ? 10 : 30;
    const maxAgeSeconds = isEnRoute ? 15 : 60;

    const isSignificant = isSignificantLocationChange(
      lastPos?.latitude ?? null,
      lastPos?.longitude ?? null,
      lastPos?.timestamp ?? null,
      latitude,
      longitude,
      now,
      minDistanceMeters,
      maxAgeSeconds
    );

    await updateWorkerOnlineLocation(workerId, latitude, longitude);

    if (!isSignificant) {
      return { status: "SKIPPED_BELOW_THRESHOLD", latitude, longitude };
    }

    lastWorkerPositions.set(workerId, { latitude, longitude, timestamp: now });

    const eventId = `loc_${now}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(locationEvents).values({
      id: eventId,
      workerId,
      assignmentId: assignmentId || null,
      latitude,
      longitude,
      speed,
      batteryLevel,
      timestamp: new Date(now),
    });

    return { status: "RECORDED", latitude, longitude, isEnRoute };
  }

  async getCurrentWorkerLocation(workerId: string): Promise<Coordinates | null> {
    const redisLocation = await getWorkerOnlineLocation(workerId);
    if (redisLocation) {
      return {
        latitude: redisLocation.latitude,
        longitude: redisLocation.longitude,
      };
    }

    const memoryLocation = lastWorkerPositions.get(workerId);
    if (memoryLocation) {
      return {
        latitude: memoryLocation.latitude,
        longitude: memoryLocation.longitude,
      };
    }

    return null;
  }

  async getWorkerLocationForEmployer(
    targetWorkerId: string,
    requestingEmployerId: string
  ): Promise<{ coordinates: Coordinates; isExact: boolean }> {
    const current = await this.getCurrentWorkerLocation(targetWorkerId);
    if (!current) {
      throw new AppError("موقعیت به‌روز نیروی کار در دسترس نیست.", "LOCATION_UNAVAILABLE", 404);
    }

    const activeAssignments = await db
      .select({
        assignmentId: shiftAssignments.id,
        employerId: shifts.employerId,
        state: shiftAssignments.state,
      })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(
        and(
          eq(shiftAssignments.workerId, targetWorkerId),
          eq(shifts.employerId, requestingEmployerId),
          inArray(shiftAssignments.state, ["EN_ROUTE", "ARRIVED", "CHECKED_IN"])
        )
      )
      .limit(1);

    if (activeAssignments.length > 0) {
      return { coordinates: current, isExact: true };
    }

    return { coordinates: maskExactLocationToApproximate(current), isExact: false };
  }
}
