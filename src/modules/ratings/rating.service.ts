import crypto from "crypto";
import { and, avg, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { branches, businessMembers } from "@/db/schema/employers";
import { ratings } from "@/db/schema/reviews";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { auditLogs } from "@/db/schema/system";
import { users } from "@/db/schema/users";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/modules/auth/auth.service";

export type RatingDirection = "WORKER_TO_EMPLOYER" | "EMPLOYER_TO_WORKER";

const RATEABLE_ASSIGNMENT_STATES = new Set(["CHECKED_OUT", "COMPLETED", "LEFT_EARLY"]);

const WORKER_TAGS = new Set([
  "محیط محترمانه",
  "شرح کار دقیق",
  "مدیریت خوب",
  "محل مناسب",
  "بی‌نظمی",
  "شرح کار متفاوت",
]);

const EMPLOYER_TAGS = new Set([
  "وقت‌شناس",
  "حرفه‌ای",
  "مسئولیت‌پذیر",
  "همکاری خوب",
  "تاخیر",
  "نیاز به آموزش",
]);

export class RatingService {
  private async loadAssignment(assignmentId: string) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    if (!row) throw new AppError("Assignment پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  private async canManageShift(
    shift: { employerId: string; businessId: string | null; branchId: string | null },
    userId: string,
    role: UserRole
  ) {
    if (!["EMPLOYER", "BRANCH_MANAGER", "SHIFT_SUPERVISOR"].includes(role)) return false;
    if (shift.employerId === userId) return true;

    if (shift.branchId) {
      const [managed] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, shift.branchId), eq(branches.managerUserId, userId)))
        .limit(1);
      if (managed) return true;
    }

    if (shift.businessId) {
      const [member] = await db
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, shift.businessId),
            eq(businessMembers.userId, userId)
          )
        )
        .limit(1);
      if (member) return true;
    }
    return false;
  }

  private async deriveDirection(
    assignmentId: string,
    actorUserId: string,
    role: UserRole
  ): Promise<{
    direction: RatingDirection;
    evaluateeId: string;
    assignment: typeof shiftAssignments.$inferSelect;
    shift: typeof shifts.$inferSelect;
  }> {
    const row = await this.loadAssignment(assignmentId);

    if (actorUserId === row.assignment.workerId && role === "WORKER") {
      return {
        direction: "WORKER_TO_EMPLOYER",
        evaluateeId: row.shift.employerId,
        assignment: row.assignment,
        shift: row.shift,
      };
    }

    if (await this.canManageShift(row.shift, actorUserId, role)) {
      return {
        direction: "EMPLOYER_TO_WORKER",
        evaluateeId: row.assignment.workerId,
        assignment: row.assignment,
        shift: row.shift,
      };
    }

    throw new AppError("شما یکی از طرفین مجاز این Assignment نیستید.", "FORBIDDEN", 403);
  }

  private validateTags(direction: RatingDirection, tags: string[]) {
    const allowed = direction === "WORKER_TO_EMPLOYER" ? WORKER_TAGS : EMPLOYER_TAGS;
    const normalized = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
    if (normalized.length > 5) {
      throw new AppError("حداکثر ۵ برچسب قابل انتخاب است.", "VALIDATION_ERROR", 422);
    }
    const invalid = normalized.filter((tag) => !allowed.has(tag));
    if (invalid.length > 0) {
      throw new AppError("برچسب امتیازدهی معتبر نیست.", "VALIDATION_ERROR", 422, { invalid });
    }
    return normalized;
  }

  async getForActor(assignmentId: string, actorUserId: string, role: UserRole) {
    const context = await this.deriveDirection(assignmentId, actorUserId, role);
    const [existing, target] = await Promise.all([
      db
        .select()
        .from(ratings)
        .where(
          and(
            eq(ratings.assignmentId, assignmentId),
            eq(ratings.direction, context.direction)
          )
        )
        .limit(1),
      db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, context.evaluateeId))
        .limit(1),
    ]);

    return {
      assignmentId,
      assignmentState: context.assignment.state,
      direction: context.direction,
      targetUserId: context.evaluateeId,
      targetName: target[0]?.fullName ?? "طرف مقابل",
      canRate: RATEABLE_ASSIGNMENT_STATES.has(context.assignment.state),
      existing: existing[0] ?? null,
      allowedTags:
        context.direction === "WORKER_TO_EMPLOYER"
          ? Array.from(WORKER_TAGS)
          : Array.from(EMPLOYER_TAGS),
    };
  }

  async submit(input: {
    assignmentId: string;
    actorUserId: string;
    actorRole: UserRole;
    score: number;
    tags: string[];
    comment?: string;
  }) {
    if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
      throw new AppError("امتیاز باید عدد صحیح بین ۱ تا ۵ باشد.", "VALIDATION_ERROR", 422);
    }

    const context = await this.deriveDirection(input.assignmentId, input.actorUserId, input.actorRole);
    if (!RATEABLE_ASSIGNMENT_STATES.has(context.assignment.state)) {
      throw new AppError("این Assignment هنوز آماده امتیازدهی نیست.", "CONFLICT", 409, {
        state: context.assignment.state,
      });
    }
    const tags = this.validateTags(context.direction, input.tags);
    const comment = input.comment?.trim();
    if (comment && comment.length > 1000) {
      throw new AppError("متن نظر بیش از حد طولانی است.", "VALIDATION_ERROR", 422);
    }

    const ratingId = `rat_${crypto.randomUUID()}`;
    let idempotent = false;
    let resultId = ratingId;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`rating:${input.assignmentId}:${context.direction}`}))`
      );

      const [freshAssignment] = await tx
        .select({ state: shiftAssignments.state })
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, input.assignmentId))
        .limit(1);
      if (!freshAssignment || !RATEABLE_ASSIGNMENT_STATES.has(freshAssignment.state)) {
        throw new AppError("وضعیت Assignment دیگر اجازه امتیازدهی نمی‌دهد.", "CONFLICT", 409);
      }

      const [existing] = await tx
        .select()
        .from(ratings)
        .where(
          and(
            eq(ratings.assignmentId, input.assignmentId),
            eq(ratings.direction, context.direction)
          )
        )
        .limit(1);
      if (existing) {
        idempotent = true;
        resultId = existing.id;
        return;
      }

      await tx.insert(ratings).values({
        id: ratingId,
        assignmentId: input.assignmentId,
        direction: context.direction,
        evaluatorId: input.actorUserId,
        evaluateeId: context.evaluateeId,
        score: input.score,
        tags,
        comment: comment || null,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorUserId,
        entityName: "rating",
        entityId: ratingId,
        action: "RATING_SUBMITTED",
        details: {
          assignmentId: input.assignmentId,
          direction: context.direction,
          evaluateeId: context.evaluateeId,
          score: input.score,
          tags,
          qualityReliabilitySeparated: true,
        },
      });
    });

    const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.id, resultId))
      .limit(1);

    return { rating, idempotent };
  }

  async getWorkerQualitySummary(workerUserId: string) {
    const [aggregate] = await db
      .select({
        averageScore: avg(ratings.score),
        ratingCount: count(ratings.id),
      })
      .from(ratings)
      .where(
        and(
          eq(ratings.evaluateeId, workerUserId),
          eq(ratings.direction, "EMPLOYER_TO_WORKER")
        )
      );

    return {
      averageScore: aggregate?.averageScore ? Number(aggregate.averageScore) : null,
      ratingCount: Number(aggregate?.ratingCount ?? 0),
    };
  }
}
