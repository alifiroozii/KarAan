import { db } from "@/db";
import { workerProfiles, users, shifts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { findNearbyOnlineWorkerIds } from "@/infrastructure/redis/redis-client";
import { getSMSAdapter } from "@/infrastructure/sms";
import { formatToJalali } from "@/lib/date";

export interface MatchedWorker {
  userId: string;
  fullName: string;
  phone: string;
  reliabilityScore: number;
  distanceMeters: number;
  isOnline: boolean;
}

export class MatchingService {
  private smsAdapter = getSMSAdapter();

  async findMatchingWorkersForShift(
    shiftId: string,
    radiusKm = 15
  ): Promise<MatchedWorker[]> {
    const shiftList = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (shiftList.length === 0) return [];
    const shift = shiftList[0];

    // 1. Get live online workers from Redis
    const onlineWorkerIds = await findNearbyOnlineWorkerIds(
      shift.latitude,
      shift.longitude,
      radiusKm
    );

    // 2. Query worker profiles from PostgreSQL (using Haversine spatial SQL calculation)
    const rad = Math.PI / 180;
    const latRad = shift.latitude * rad;
    const lngRad = shift.longitude * rad;

    // PostGIS distance SQL formula in meters
    const distanceSql = sql<number>`
      ROUND(
        6371000 * acos(
          cos(${latRad}) * cos(RADIANS(${workerProfiles.homeLatitude})) *
          cos(RADIANS(${workerProfiles.homeLongitude}) - ${lngRad}) +
          sin(${latRad}) * sin(RADIANS(${workerProfiles.homeLatitude}))
        )
      )
    `;

    const candidates = await db
      .select({
        userId: users.id,
        fullName: users.fullName,
        phone: users.phone,
        reliabilityScore: workerProfiles.reliabilityScore,
        skills: workerProfiles.skills,
        distanceMeters: distanceSql,
      })
      .from(workerProfiles)
      .innerJoin(users, eq(users.id, workerProfiles.userId))
      .where(and(eq(users.role, "WORKER")))
      .limit(50);

    // Filter and rank candidates
    const matched: MatchedWorker[] = candidates
      .filter((c) => {
        if (!c.distanceMeters || c.distanceMeters > radiusKm * 1000) {
          // If home location is far, check if worker is online in Redis
          if (!onlineWorkerIds.includes(c.userId)) return false;
        }
        return true;
      })
      .map((c) => ({
        userId: c.userId,
        fullName: c.fullName,
        phone: c.phone,
        reliabilityScore: parseFloat(c.reliabilityScore || "100.00"),
        distanceMeters: c.distanceMeters || 1000,
        isOnline: onlineWorkerIds.includes(c.userId),
      }))
      .sort((a, b) => {
        // Rank by online status first, then reliability score, then distance
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        if (b.reliabilityScore !== a.reliabilityScore)
          return b.reliabilityScore - a.reliabilityScore;
        return a.distanceMeters - b.distanceMeters;
      });

    return matched;
  }

  async dispatchShiftAlertToWorkers(shiftId: string): Promise<number> {
    const shiftList = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (shiftList.length === 0) return 0;
    const shift = shiftList[0];

    const workers = await this.findMatchingWorkersForShift(shiftId);
    let alertCount = 0;

    for (const w of workers.slice(0, 10)) {
      // Dispatch SMS alert
      await this.smsAdapter.sendShiftAlert(
        w.phone,
        shift.title,
        formatToJalali(shift.startTime)
      );
      alertCount++;
    }

    return alertCount;
  }
}
