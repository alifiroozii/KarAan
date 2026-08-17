import { db } from "@/db";
import { sanctions } from "@/db/schema/reliability";
import { workerProfiles } from "@/db/schema/workers";
import { shifts, shiftSlots, shiftOffers } from "@/db/schema/shifts";
import { users } from "@/db/schema/users";
import { eq, and, gt, isNull, lte, or } from "drizzle-orm";
import { calculateDistanceKm } from "@/lib/maps/distance";
import { AppError } from "@/lib/errors";

export interface MatchingFilterOptions {
  shiftId: string;
  maxDistanceKm?: number;
  limit?: number;
  excludeWorkerIds?: string[];
}

export interface MatchedWorkerResult {
  workerId: string;
  fullName: string;
  phone: string;
  distanceKm: number;
  reliabilityScore: number;
  completedShiftsCount: number;
  hourlyRateRials: bigint;
  matchingSkills: string[];
}

export class MatchingService {
  /**
   * Find nearby qualified workers for a published Shift.
   *
   * Active Reliability sanctions are authoritative: a suspended/banned/restricted
   * Worker cannot enter matching even if Redis presence still says AVAILABLE.
   */
  async findQualifiedWorkers(options: MatchingFilterOptions): Promise<MatchedWorkerResult[]> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, options.shiftId)).limit(1);
    if (!shift) {
      throw new AppError("شیفت کاری پیدا نشد.", "NOT_FOUND", 404);
    }

    const maxDistance = options.maxDistanceKm || 25;
    const excluded = new Set(options.excludeWorkerIds ?? []);
    const now = new Date();

    const activeSanctions = await db
      .select({ workerId: sanctions.userId })
      .from(sanctions)
      .where(
        and(
          eq(sanctions.status, "ACTIVE"),
          lte(sanctions.startAt, now),
          or(isNull(sanctions.endAt), gt(sanctions.endAt, now))
        )
      );
    for (const item of activeSanctions) excluded.add(item.workerId);

    const profiles = await db
      .select({
        workerId: workerProfiles.userId,
        fullName: users.fullName,
        phone: users.phone,
        homeLat: workerProfiles.homeLatitude,
        homeLng: workerProfiles.homeLongitude,
        reliabilityScore: workerProfiles.reliabilityScore,
        isAvailable: workerProfiles.isAvailable,
        verificationStatus: workerProfiles.verificationStatus,
        completedShiftsCount: workerProfiles.completedShiftsCount,
        hourlyRateRials: workerProfiles.hourlyRateRials,
      })
      .from(workerProfiles)
      .innerJoin(users, eq(workerProfiles.userId, users.id))
      .where(
        and(
          eq(workerProfiles.isAvailable, true),
          eq(workerProfiles.verificationStatus, "VERIFIED")
        )
      );

    const matchedList: MatchedWorkerResult[] = [];

    for (const profile of profiles) {
      if (excluded.has(profile.workerId)) continue;

      let distanceKm = 0;
      if (profile.homeLat != null && profile.homeLng != null) {
        distanceKm = calculateDistanceKm(
          shift.latitude,
          shift.longitude,
          profile.homeLat,
          profile.homeLng
        );
      }

      if (distanceKm > maxDistance) continue;

      const relScoreNum = parseFloat(profile.reliabilityScore || "100.00");
      if (relScoreNum < (shift.minReliability || 0)) continue;

      matchedList.push({
        workerId: profile.workerId,
        fullName: profile.fullName,
        phone: profile.phone,
        distanceKm: Math.round(distanceKm * 10) / 10,
        reliabilityScore: relScoreNum,
        completedShiftsCount: profile.completedShiftsCount,
        hourlyRateRials: profile.hourlyRateRials,
        matchingSkills: (shift.requiredSkills as string[]) || [],
      });
    }

    matchedList.sort(
      (a, b) => b.reliabilityScore - a.reliabilityScore || a.distanceKm - b.distanceKm
    );

    return matchedList.slice(0, options.limit || 20);
  }

  async dispatchOffersForShift(shiftId: string, limit = 5): Promise<number> {
    const matched = await this.findQualifiedWorkers({ shiftId, limit });
    const [openSlot] = await db
      .select()
      .from(shiftSlots)
      .where(and(eq(shiftSlots.shiftId, shiftId), eq(shiftSlots.status, "OPEN")))
      .limit(1);

    if (!openSlot) return 0;

    let offersCount = 0;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    for (const worker of matched) {
      const offerId = `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(shiftOffers).values({
        id: offerId,
        shiftSlotId: openSlot.id,
        workerId: worker.workerId,
        offeredPayRials: BigInt(1500000),
        status: "PENDING",
        expiresAt,
      });
      offersCount++;
    }

    return offersCount;
  }
}
