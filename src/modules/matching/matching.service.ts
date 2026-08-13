import { db } from "@/db";
import { workerProfiles, workerSkills, skills } from "@/db/schema/workers";
import { shifts, shiftSlots, shiftOffers } from "@/db/schema/shifts";
import { users } from "@/db/schema/users";
import { eq, and, gte, inArray } from "drizzle-orm";
import { calculateDistanceKm } from "@/lib/maps/distance";
import { AppError } from "@/lib/errors";

export interface MatchingFilterOptions {
  shiftId: string;
  maxDistanceKm?: number;
  limit?: number;
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
   * Find nearby qualified workers for a published Shift
   */
  async findQualifiedWorkers(options: MatchingFilterOptions): Promise<MatchedWorkerResult[]> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, options.shiftId)).limit(1);
    if (!shift) {
      throw new AppError("شیفت کاری پیدا نشد.", "NOT_FOUND", 404);
    }

    const maxDistance = options.maxDistanceKm || 25; // Default 25km radius

    // Retrieve all active and verified worker profiles
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
      // Calculate distance between shift location and worker home location
      let distanceKm = 0;
      if (profile.homeLat && profile.homeLng) {
        distanceKm = calculateDistanceKm(
          shift.latitude,
          shift.longitude,
          profile.homeLat,
          profile.homeLng
        );
      }

      if (distanceKm <= maxDistance) {
        // Filter by minimum reliability score
        const relScoreNum = parseFloat(profile.reliabilityScore || "100.00");
        if (relScoreNum >= (shift.minReliability || 0)) {
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
      }
    }

    // Sort by highest reliability score and nearest distance
    matchedList.sort((a, b) => b.reliabilityScore - a.reliabilityScore || a.distanceKm - b.distanceKm);

    return matchedList.slice(0, options.limit || 20);
  }

  /**
   * Automatically dispatch shift offers to matched workers
   */
  async dispatchOffersForShift(shiftId: string, limit = 5): Promise<number> {
    const matched = await this.findQualifiedWorkers({ shiftId, limit });
    const [openSlot] = await db
      .select()
      .from(shiftSlots)
      .where(and(eq(shiftSlots.shiftId, shiftId), eq(shiftSlots.status, "OPEN")))
      .limit(1);

    if (!openSlot) {
      return 0;
    }

    let offersCount = 0;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Offer expires in 15 mins

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
