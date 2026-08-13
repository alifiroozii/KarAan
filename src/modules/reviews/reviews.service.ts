import { db } from "@/db";
import { ratings, workerProfiles, workerRosters, employerProfiles, auditLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export class ReviewsService {
  async submitRating(
    assignmentId: string,
    evaluatorId: string,
    evaluateeId: string,
    score: number,
    tags: string[] = [],
    comment?: string
  ): Promise<{ success: boolean; ratingId: string }> {
    if (score < 1 || score > 5) {
      throw new AppError("امتیاز باید بین ۱ تا ۵ باشد.", "VALIDATION_ERROR", 422);
    }

    const ratingId = `rat_${crypto.randomUUID()}`;

    await db.insert(ratings).values({
      id: ratingId,
      assignmentId,
      evaluatorId,
      evaluateeId,
      score,
      tags,
      comment,
    });

    // Update worker reliability score if evaluatee is a worker
    const workerProfileList = await db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, evaluateeId))
      .limit(1);

    if (workerProfileList.length > 0) {
      const profile = workerProfileList[0];
      const currentScore = parseFloat(profile.reliabilityScore || "100.00");
      // Adjust score: 5 stars => +2, 4 stars => +1, 3 stars => 0, 1-2 stars => -5
      let delta = 0;
      if (score === 5) delta = 2.0;
      else if (score === 4) delta = 1.0;
      else if (score <= 2) delta = -5.0;

      const newScore = Math.min(100.0, Math.max(0.0, currentScore + delta)).toFixed(2);

      await db
        .update(workerProfiles)
        .set({
          reliabilityScore: newScore,
          updatedAt: new Date(),
        })
        .where(eq(workerProfiles.id, profile.id));
    }

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: evaluatorId,
      entityName: "rating",
      entityId: ratingId,
      action: "RATING_SUBMITTED",
      details: { score, evaluateeId, tags },
    });

    return { success: true, ratingId };
  }

  async toggleEmployerFavorite(
    employerUserId: string,
    workerUserId: string
  ): Promise<{ isFavorite: boolean }> {
    const employerProfileList = await db
      .select()
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, employerUserId))
      .limit(1);

    const workerProfileList = await db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, workerUserId))
      .limit(1);

    if (employerProfileList.length === 0 || workerProfileList.length === 0) {
      throw new AppError("پروفایل کاربر یافت نشد.", "NOT_FOUND", 404);
    }

    const employerProfileId = employerProfileList[0].id;
    const workerProfileId = workerProfileList[0].id;

    const existing = await db
      .select()
      .from(workerRosters)
      .where(
        sql`${workerRosters.employerProfileId} = ${employerProfileId} AND ${workerRosters.workerProfileId} = ${workerProfileId}`
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(workerRosters)
        .where(eq(workerRosters.id, existing[0].id));
      return { isFavorite: false };
    } else {
      await db.insert(workerRosters).values({
        id: `fav_${crypto.randomUUID()}`,
        employerProfileId,
        workerProfileId,
        rosterType: "FAVORITE",
      });
      return { isFavorite: true };
    }
  }
}
