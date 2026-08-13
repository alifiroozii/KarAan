import { db } from "@/db";
import { locationEvents } from "@/db/schema/attendance";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { eq, and, inArray } from "drizzle-orm";
import { maskExactLocationToApproximate, isSignificantLocationChange } from "@/lib/location/privacy";
import { Coordinates } from "@/lib/maps/types";
import { AppError } from "@/lib/errors";

// In-memory memory tracking cache for last worker position
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
  /**
   * Record worker live location update with threshold filtering
   */
  async updateWorkerLocation(options: LocationUpdateOptions) {
    const { workerId, latitude, longitude, speed, batteryLevel, assignmentId } = options;
    const now = Date.now();
    const lastPos = lastWorkerPositions.get(workerId);

    // Determine thresholds based on whether worker is EN_ROUTE
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

    if (!isSignificant) {
      return { status: "SKIPPED_BELOW_THRESHOLD", latitude, longitude };
    }

    // Update in-memory last position
    lastWorkerPositions.set(workerId, { latitude, longitude, timestamp: now });

    // Store in PostgreSQL/PostGIS historical log
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

  /**
   * Retrieve worker location for an employer with strict privacy masking.
   * If assignment is active and EN_ROUTE -> Return exact coordinates.
   * Otherwise -> Return masked approximate coordinates (~1 km grid).
   */
  async getWorkerLocationForEmployer(
    targetWorkerId: string,
    requestingEmployerId: string
  ): Promise<{ coordinates: Coordinates; isExact: boolean }> {
    const lastPos = lastWorkerPositions.get(targetWorkerId);
    const defaultCoords: Coordinates = { latitude: 35.7000, longitude: 51.3500 };
    const rawCoords: Coordinates = lastPos
      ? { latitude: lastPos.latitude, longitude: lastPos.longitude }
      : defaultCoords;

    // Check if worker has an active EN_ROUTE assignment with this employer
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

    const hasActiveAssignment = activeAssignments.length > 0;

    if (hasActiveAssignment) {
      // Employer is allowed to see exact real-time coordinates during active shift navigation
      return { coordinates: rawCoords, isExact: true };
    }

    // Pre-match / unassigned -> Mask exact location for privacy
    return { coordinates: maskExactLocationToApproximate(rawCoords), isExact: false };
  }
}
