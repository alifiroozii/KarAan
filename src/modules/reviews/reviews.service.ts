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

    // Quality Rating and Reliability are intentionally separate domains.
    // Reliability changes only through the authoritative ReliabilityService
    // from operational events such as no-show, cancellation and completion.
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
    }

    await db.insert(workerRosters).values({
      id: `fav_${crypto.randomUUID()}`,
      employerProfileId,
      workerProfileId,
      rosterType: "FAVORITE",
    });
    return { isFavorite: true };
  }
}
