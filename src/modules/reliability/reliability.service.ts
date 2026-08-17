import crypto from "crypto";
import { and, desc, eq, gt, isNull, like, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cancellations,
  noShowEvents,
  reliabilityEvents,
  sanctions,
  strikes,
} from "@/db/schema/reliability";
import { shiftAssignments } from "@/db/schema/shifts";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { workerProfiles } from "@/db/schema/workers";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import {
  clampReliabilityScore,
  DEFAULT_RELIABILITY_POLICY,
  normalizeReliabilityPolicy,
  type ReliabilityPolicy,
} from "./reliability-policy";

export type ReliabilityEventType =
  | "SHIFT_COMPLETED"
  | "LATE_CANCELLATION"
  | "WORKER_CANCELLATION"
  | "NO_SHOW"
  | "LATE_ARRIVAL"
  | "EARLY_LEAVE"
  | "PUNCTUAL_BONUS"
  | "MANUAL_ADJUSTMENT"
  | "REVERSAL";

export interface ReliabilityMutationInput {
  workerId: string;
  assignmentId?: string | null;
  eventType: Exclude<ReliabilityEventType, "REVERSAL">;
  sourceType: string;
  sourceId: string;
  scoreDelta: number;
  reason?: string;
  metadata?: Record<string, unknown>;
  strikeRecommended?: boolean;
  strikeWeight?: number;
  actorId?: string | null;
}

function idempotencyKey(input: {
  sourceType: string;
  sourceId: string;
  eventType: string;
}) {
  return `${input.sourceType}:${input.sourceId}:${input.eventType}`;
}

function numberFromNumeric(value: string | number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class ReliabilityService {
  private async readPolicy(): Promise<ReliabilityPolicy> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, "reliability.policy"))
      .limit(1);
    return normalizeReliabilityPolicy(setting?.value ?? DEFAULT_RELIABILITY_POLICY);
  }

  private async expireStaleRecords(workerId: string, now: Date) {
    await db
      .update(strikes)
      .set({ status: "EXPIRED" })
      .where(
        and(
          eq(strikes.userId, workerId),
          eq(strikes.status, "ACTIVE"),
          lte(strikes.expiresAt, now)
        )
      );
    await db
      .update(sanctions)
      .set({ status: "EXPIRED", updatedAt: now })
      .where(
        and(
          eq(sanctions.userId, workerId),
          eq(sanctions.status, "ACTIVE"),
          lte(sanctions.endAt, now)
        )
      );
  }

  private async activeStrikeWeightInTx(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    workerId: string,
    now: Date
  ) {
    const rows = await tx
      .select({ weight: strikes.weight })
      .from(strikes)
      .where(
        and(
          eq(strikes.userId, workerId),
          eq(strikes.status, "ACTIVE"),
          gt(strikes.expiresAt, now)
        )
      );
    return rows.reduce((sum, row) => sum + row.weight, 0);
  }

  private async createAutomaticSanctionIfNeeded(input: {
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0];
    workerId: string;
    reliabilityEventId: string;
    activeStrikeWeight: number;
    policy: ReliabilityPolicy;
    now: Date;
  }) {
    const { tx, workerId, reliabilityEventId, activeStrikeWeight, policy, now } = input;
    let sanctionType: "TEMPORARY_SUSPENSION" | "PERMANENT_BAN" | null = null;
    let endAt: Date | null = null;

    if (
      policy.permanentBanAtStrikeWeight != null &&
      activeStrikeWeight >= policy.permanentBanAtStrikeWeight
    ) {
      sanctionType = "PERMANENT_BAN";
    } else if (activeStrikeWeight >= policy.automaticSuspensionAtStrikeWeight) {
      sanctionType = "TEMPORARY_SUSPENSION";
      endAt = new Date(now.getTime() + policy.automaticSuspensionDays * 86_400_000);
    }
    if (!sanctionType) return null;

    const activeConditions = [
      eq(sanctions.userId, workerId),
      eq(sanctions.status, "ACTIVE"),
      eq(sanctions.sanctionType, sanctionType),
      lte(sanctions.startAt, now),
    ];
    if (sanctionType === "TEMPORARY_SUSPENSION") {
      activeConditions.push(or(isNull(sanctions.endAt), gt(sanctions.endAt, now))!);
    }

    const [existing] = await tx
      .select({ id: sanctions.id })
      .from(sanctions)
      .where(and(...activeConditions))
      .limit(1);
    if (existing) return null;

    const sanctionId = `san_${crypto.randomUUID()}`;
    await tx.insert(sanctions).values({
      id: sanctionId,
      idempotencyKey: `auto:${reliabilityEventId}:${sanctionType}`,
      userId: workerId,
      reliabilityEventId,
      sanctionType,
      status: "ACTIVE",
      startAt: now,
      endAt,
      reason:
        sanctionType === "PERMANENT_BAN"
          ? `Automatic reliability ban at strike weight ${activeStrikeWeight}`
          : `Automatic reliability suspension at strike weight ${activeStrikeWeight}`,
      createdAt: now,
      updatedAt: now,
    });
    return { id: sanctionId, sanctionType, endAt };
  }

  async applyEvent(input: ReliabilityMutationInput) {
    const policy = await this.readPolicy();
    const key = idempotencyKey(input);
    const now = new Date();
    let output:
      | {
          eventId: string;
          previousScore: number;
          resultingScore: number;
          scoreDelta: number;
          idempotent: boolean;
          strikeId: string | null;
          sanctionId: string | null;
          sanctionType: string | null;
        }
      | null = null;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`reliability:${input.workerId}`}))`
      );

      const [existing] = await tx
        .select()
        .from(reliabilityEvents)
        .where(eq(reliabilityEvents.idempotencyKey, key))
        .limit(1);
      if (existing) {
        output = {
          eventId: existing.id,
          previousScore: numberFromNumeric(existing.previousScore),
          resultingScore: numberFromNumeric(existing.resultingScore),
          scoreDelta: numberFromNumeric(existing.scoreDelta),
          idempotent: true,
          strikeId: null,
          sanctionId: null,
          sanctionType: null,
        };
        return;
      }

      const [profile] = await tx
        .select({ id: workerProfiles.id, score: workerProfiles.reliabilityScore })
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, input.workerId))
        .limit(1);
      if (!profile) throw new AppError("پروفایل Worker پیدا نشد.", "NOT_FOUND", 404);

      const previousScore = numberFromNumeric(profile.score, policy.maxScore);
      const resultingScore = clampReliabilityScore(previousScore + input.scoreDelta, policy);
      const appliedDelta = Math.round((resultingScore - previousScore) * 100) / 100;
      const eventId = `rel_${crypto.randomUUID()}`;

      await tx.insert(reliabilityEvents).values({
        id: eventId,
        idempotencyKey: key,
        workerId: input.workerId,
        assignmentId: input.assignmentId ?? null,
        eventType: input.eventType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        policyVersion: policy.version,
        scoreDelta: appliedDelta.toFixed(2),
        previousScore: previousScore.toFixed(2),
        resultingScore: resultingScore.toFixed(2),
        reason: input.reason,
        metadata: input.metadata ?? {},
        createdAt: now,
      });
      await tx
        .update(workerProfiles)
        .set({ reliabilityScore: resultingScore.toFixed(2), updatedAt: now })
        .where(eq(workerProfiles.id, profile.id));

      let strikeId: string | null = null;
      if (input.strikeRecommended && appliedDelta < 0) {
        strikeId = `stk_${crypto.randomUUID()}`;
        await tx.insert(strikes).values({
          id: strikeId,
          idempotencyKey: `strike:${eventId}`,
          userId: input.workerId,
          reliabilityEventId: eventId,
          status: "ACTIVE",
          weight: Math.max(1, Math.min(10, Math.floor(input.strikeWeight ?? 1))),
          reason: input.reason ?? input.eventType,
          issuedByUserId: input.actorId ?? null,
          expiresAt: new Date(now.getTime() + policy.strikeDurationDays * 86_400_000),
          createdAt: now,
        });
      }

      await tx
        .update(strikes)
        .set({ status: "EXPIRED" })
        .where(
          and(
            eq(strikes.userId, input.workerId),
            eq(strikes.status, "ACTIVE"),
            lte(strikes.expiresAt, now)
          )
        );
      const activeStrikeWeight = await this.activeStrikeWeightInTx(tx, input.workerId, now);
      const sanction = await this.createAutomaticSanctionIfNeeded({
        tx,
        workerId: input.workerId,
        reliabilityEventId: eventId,
        activeStrikeWeight,
        policy,
        now,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorId ?? null,
        entityName: "reliability_event",
        entityId: eventId,
        action: "RELIABILITY_EVENT_APPLIED",
        details: {
          workerId: input.workerId,
          assignmentId: input.assignmentId ?? null,
          eventType: input.eventType,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          policyVersion: policy.version,
          requestedDelta: input.scoreDelta,
          appliedDelta,
          previousScore,
          resultingScore,
          strikeId,
          activeStrikeWeight,
          sanctionId: sanction?.id ?? null,
          sanctionType: sanction?.sanctionType ?? null,
        },
      });

      output = {
        eventId,
        previousScore,
        resultingScore,
        scoreDelta: appliedDelta,
        idempotent: false,
        strikeId,
        sanctionId: sanction?.id ?? null,
        sanctionType: sanction?.sanctionType ?? null,
      };
    });

    if (!output) throw new AppError("Reliability mutation تکمیل نشد.", "INTERNAL_SERVER_ERROR", 500);
    const finalOutput = output as {
      eventId: string;
      previousScore: number;
      resultingScore: number;
      scoreDelta: number;
      idempotent: boolean;
      strikeId: string | null;
      sanctionId: string | null;
      sanctionType: string | null;
    };

    if (!finalOutput.idempotent) {
      publishRealtimeEvent("user", input.workerId, "reliability.updated", {
        workerId: input.workerId,
        eventId: finalOutput.eventId,
        scoreDelta: finalOutput.scoreDelta,
        resultingScore: finalOutput.resultingScore,
      });
      if (finalOutput.strikeId) {
        publishRealtimeEvent("user", input.workerId, "strike.created", {
          workerId: input.workerId,
          strikeId: finalOutput.strikeId,
        });
      }
      if (finalOutput.sanctionId && finalOutput.sanctionType) {
        publishRealtimeEvent("user", input.workerId, "sanction.created", {
          workerId: input.workerId,
          sanctionId: finalOutput.sanctionId,
          sanctionType: finalOutput.sanctionType,
        });
      }
    }

    return finalOutput;
  }

  async reverseSource(input: {
    workerId: string;
    sourceType: string;
    sourceId: string;
    reason: string;
    actorId?: string | null;
  }) {
    const policy = await this.readPolicy();
    const now = new Date();
    let output:
      | {
          reversed: boolean;
          originalEventId: string | null;
          reversalEventId: string | null;
          resultingScore: number | null;
        }
      | null = null;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`reliability:${input.workerId}`}))`
      );
      const [original] = await tx
        .select()
        .from(reliabilityEvents)
        .where(
          and(
            eq(reliabilityEvents.workerId, input.workerId),
            eq(reliabilityEvents.sourceType, input.sourceType),
            eq(reliabilityEvents.sourceId, input.sourceId),
            isNull(reliabilityEvents.reversedAt)
          )
        )
        .orderBy(desc(reliabilityEvents.createdAt))
        .limit(1);

      if (!original || original.eventType === "REVERSAL") {
        output = {
          reversed: false,
          originalEventId: original?.id ?? null,
          reversalEventId: original?.reversalEventId ?? null,
          resultingScore: null,
        };
        return;
      }

      const reversalKey = `reversal:${original.id}`;
      const [existingReversal] = await tx
        .select()
        .from(reliabilityEvents)
        .where(eq(reliabilityEvents.idempotencyKey, reversalKey))
        .limit(1);
      if (existingReversal) {
        output = {
          reversed: true,
          originalEventId: original.id,
          reversalEventId: existingReversal.id,
          resultingScore: numberFromNumeric(existingReversal.resultingScore),
        };
        return;
      }

      const [profile] = await tx
        .select({ id: workerProfiles.id, score: workerProfiles.reliabilityScore })
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, input.workerId))
        .limit(1);
      if (!profile) throw new AppError("پروفایل Worker پیدا نشد.", "NOT_FOUND", 404);

      const previousScore = numberFromNumeric(profile.score, policy.maxScore);
      const requestedDelta = -numberFromNumeric(original.scoreDelta);
      const resultingScore = clampReliabilityScore(previousScore + requestedDelta, policy);
      const appliedDelta = Math.round((resultingScore - previousScore) * 100) / 100;
      const reversalEventId = `rel_${crypto.randomUUID()}`;

      await tx.insert(reliabilityEvents).values({
        id: reversalEventId,
        idempotencyKey: reversalKey,
        workerId: input.workerId,
        assignmentId: original.assignmentId,
        eventType: "REVERSAL",
        sourceType: "RELIABILITY_EVENT",
        sourceId: original.id,
        policyVersion: policy.version,
        scoreDelta: appliedDelta.toFixed(2),
        previousScore: previousScore.toFixed(2),
        resultingScore: resultingScore.toFixed(2),
        reason: input.reason,
        metadata: {
          originalSourceType: original.sourceType,
          originalSourceId: original.sourceId,
          originalEventType: original.eventType,
        },
        createdAt: now,
      });
      await tx
        .update(reliabilityEvents)
        .set({ reversedAt: now, reversalEventId })
        .where(eq(reliabilityEvents.id, original.id));
      await tx
        .update(workerProfiles)
        .set({ reliabilityScore: resultingScore.toFixed(2), updatedAt: now })
        .where(eq(workerProfiles.id, profile.id));
      await tx
        .update(strikes)
        .set({ status: "REVOKED", revokedAt: now })
        .where(
          and(
            eq(strikes.reliabilityEventId, original.id),
            eq(strikes.status, "ACTIVE")
          )
        );

      const activeStrikeWeight = await this.activeStrikeWeightInTx(tx, input.workerId, now);
      if (activeStrikeWeight < policy.automaticSuspensionAtStrikeWeight) {
        await tx
          .update(sanctions)
          .set({ status: "REVOKED", revokedAt: now, updatedAt: now })
          .where(
            and(
              eq(sanctions.userId, input.workerId),
              eq(sanctions.status, "ACTIVE"),
              like(sanctions.idempotencyKey, "auto:%"),
              eq(sanctions.sanctionType, "TEMPORARY_SUSPENSION")
            )
          );
      }
      if (
        policy.permanentBanAtStrikeWeight != null &&
        activeStrikeWeight < policy.permanentBanAtStrikeWeight
      ) {
        await tx
          .update(sanctions)
          .set({ status: "REVOKED", revokedAt: now, updatedAt: now })
          .where(
            and(
              eq(sanctions.userId, input.workerId),
              eq(sanctions.status, "ACTIVE"),
              like(sanctions.idempotencyKey, "auto:%"),
              eq(sanctions.sanctionType, "PERMANENT_BAN")
            )
          );
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorId ?? null,
        entityName: "reliability_event",
        entityId: original.id,
        action: "RELIABILITY_EVENT_REVERSED",
        details: {
          workerId: input.workerId,
          reversalEventId,
          reason: input.reason,
          previousScore,
          resultingScore,
          activeStrikeWeight,
        },
      });

      output = {
        reversed: true,
        originalEventId: original.id,
        reversalEventId,
        resultingScore,
      };
    });

    const finalOutput = output ?? {
      reversed: false,
      originalEventId: null,
      reversalEventId: null,
      resultingScore: null,
    };
    if (finalOutput.reversed && finalOutput.reversalEventId && finalOutput.resultingScore != null) {
      publishRealtimeEvent("user", input.workerId, "reliability.updated", {
        workerId: input.workerId,
        eventId: finalOutput.reversalEventId,
        scoreDelta: 0,
        resultingScore: finalOutput.resultingScore,
      });
      publishRealtimeEvent("user", input.workerId, "sanction.revoked", {
        workerId: input.workerId,
        reason: input.reason,
      });
    }
    return finalOutput;
  }

  async processNoShow(noShowEventId: string) {
    const [event] = await db
      .select()
      .from(noShowEvents)
      .where(eq(noShowEvents.id, noShowEventId))
      .limit(1);
    if (!event) throw new AppError("No-show event پیدا نشد.", "NOT_FOUND", 404);

    if (event.status === "OVERRIDDEN") {
      return this.reverseSource({
        workerId: event.workerId,
        sourceType: "NO_SHOW",
        sourceId: event.id,
        reason: event.overrideReason ?? "NO_SHOW_OVERRIDDEN",
        actorId: event.resolvedByUserId,
      });
    }
    if (event.status !== "FINAL") return { skipped: true, status: event.status };

    const penalty = Math.abs(numberFromNumeric(event.reliabilityPenalty, 25));
    return this.applyEvent({
      workerId: event.workerId,
      assignmentId: event.assignmentId,
      eventType: "NO_SHOW",
      sourceType: "NO_SHOW",
      sourceId: event.id,
      scoreDelta: -penalty,
      reason: "عدم حضور نهایی در شیفت",
      strikeRecommended: event.strikeRecommended === 1,
      strikeWeight: 1,
      metadata: {
        detectedAt: event.detectedAt.toISOString(),
        finalizedAt: event.finalizedAt?.toISOString() ?? null,
        detectionSource: event.detectionSource,
      },
    });
  }

  async processCancellationForAssignment(assignmentId: string) {
    const [cancellation] = await db
      .select({ cancellation: cancellations, workerId: shiftAssignments.workerId })
      .from(cancellations)
      .innerJoin(shiftAssignments, eq(shiftAssignments.id, cancellations.assignmentId))
      .where(eq(cancellations.assignmentId, assignmentId))
      .limit(1);
    if (!cancellation) return { skipped: true, reason: "NO_CANCELLATION" };
    if (cancellation.cancellation.cancelledBySide !== "WORKER") {
      return { skipped: true, reason: "EMPLOYER_CANCELLATION" };
    }

    const delta = numberFromNumeric(cancellation.cancellation.scoreImpact, 0);
    if (delta === 0) return { skipped: true, reason: "ZERO_SCORE_IMPACT" };

    return this.applyEvent({
      workerId: cancellation.workerId,
      assignmentId,
      eventType: cancellation.cancellation.isLate === 1 ? "LATE_CANCELLATION" : "WORKER_CANCELLATION",
      sourceType: "CANCELLATION",
      sourceId: cancellation.cancellation.id,
      scoreDelta: delta,
      reason: cancellation.cancellation.reason,
      strikeRecommended: cancellation.cancellation.isLate === 1 && delta <= -10,
      metadata: {
        reasonCode: cancellation.cancellation.reasonCode,
        minutesBeforeStart: cancellation.cancellation.minutesBeforeStart,
        policySnapshot: cancellation.cancellation.policySnapshot,
      },
    });
  }

  async processAssignmentCompleted(assignmentId: string) {
    const [assignment] = await db
      .select({ workerId: shiftAssignments.workerId, state: shiftAssignments.state })
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    if (!assignment || assignment.state !== "COMPLETED") {
      return { skipped: true, reason: "ASSIGNMENT_NOT_COMPLETED" };
    }
    const policy = await this.readPolicy();
    return this.applyEvent({
      workerId: assignment.workerId,
      assignmentId,
      eventType: "SHIFT_COMPLETED",
      sourceType: "ASSIGNMENT_COMPLETION",
      sourceId: assignmentId,
      scoreDelta: policy.shiftCompletedDelta,
      reason: "تکمیل موفق شیفت",
    });
  }

  async scanSources() {
    const [noShows, cancelledAssignments, completedAssignments] = await Promise.all([
      db
        .select({ id: noShowEvents.id })
        .from(noShowEvents)
        .where(or(eq(noShowEvents.status, "FINAL"), eq(noShowEvents.status, "OVERRIDDEN")))
        .orderBy(desc(noShowEvents.updatedAt))
        .limit(200),
      db
        .select({ assignmentId: cancellations.assignmentId })
        .from(cancellations)
        .where(eq(cancellations.cancelledBySide, "WORKER"))
        .orderBy(desc(cancellations.createdAt))
        .limit(200),
      db
        .select({ id: shiftAssignments.id })
        .from(shiftAssignments)
        .where(eq(shiftAssignments.state, "COMPLETED"))
        .orderBy(desc(shiftAssignments.updatedAt))
        .limit(200),
    ]);

    const jobs = [
      ...noShows.map((item) => () => this.processNoShow(item.id)),
      ...cancelledAssignments.map((item) => () => this.processCancellationForAssignment(item.assignmentId)),
      ...completedAssignments.map((item) => () => this.processAssignmentCompleted(item.id)),
    ];
    const settled = await Promise.allSettled(jobs.map((job) => job()));
    const errors = settled
      .map((item, index) =>
        item.status === "rejected"
          ? { index, message: item.reason instanceof Error ? item.reason.message : "unknown" }
          : null
      )
      .filter((item): item is { index: number; message: string } => item != null);

    return { scanned: jobs.length, errors };
  }

  async assertWorkerCanTakeShifts(workerId: string) {
    const now = new Date();
    await this.expireStaleRecords(workerId, now);
    const [active] = await db
      .select({
        id: sanctions.id,
        sanctionType: sanctions.sanctionType,
        endAt: sanctions.endAt,
        reason: sanctions.reason,
      })
      .from(sanctions)
      .where(
        and(
          eq(sanctions.userId, workerId),
          eq(sanctions.status, "ACTIVE"),
          lte(sanctions.startAt, now),
          or(isNull(sanctions.endAt), gt(sanctions.endAt, now))
        )
      )
      .limit(1);

    if (active) {
      throw new AppError("به علت محدودیت فعال، امکان دریافت شیفت جدید ندارید.", "FORBIDDEN", 403, {
        sanctionId: active.id,
        sanctionType: active.sanctionType,
        endAt: active.endAt?.toISOString() ?? null,
        reason: active.reason,
      });
    }
    return true;
  }

  async getWorkerSummary(workerId: string) {
    const now = new Date();
    await this.expireStaleRecords(workerId, now);
    const [profile] = await db
      .select({ score: workerProfiles.reliabilityScore })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, workerId))
      .limit(1);
    if (!profile) throw new AppError("پروفایل Worker پیدا نشد.", "NOT_FOUND", 404);

    const [activeStrikeRows, activeSanctionRows, recentEvents] = await Promise.all([
      db
        .select({ id: strikes.id, weight: strikes.weight, reason: strikes.reason, expiresAt: strikes.expiresAt })
        .from(strikes)
        .where(
          and(eq(strikes.userId, workerId), eq(strikes.status, "ACTIVE"), gt(strikes.expiresAt, now))
        )
        .orderBy(desc(strikes.createdAt)),
      db
        .select({
          id: sanctions.id,
          sanctionType: sanctions.sanctionType,
          reason: sanctions.reason,
          startAt: sanctions.startAt,
          endAt: sanctions.endAt,
        })
        .from(sanctions)
        .where(
          and(
            eq(sanctions.userId, workerId),
            eq(sanctions.status, "ACTIVE"),
            lte(sanctions.startAt, now),
            or(isNull(sanctions.endAt), gt(sanctions.endAt, now))
          )
        )
        .orderBy(desc(sanctions.createdAt)),
      db
        .select({
          id: reliabilityEvents.id,
          eventType: reliabilityEvents.eventType,
          scoreDelta: reliabilityEvents.scoreDelta,
          previousScore: reliabilityEvents.previousScore,
          resultingScore: reliabilityEvents.resultingScore,
          reason: reliabilityEvents.reason,
          policyVersion: reliabilityEvents.policyVersion,
          reversedAt: reliabilityEvents.reversedAt,
          createdAt: reliabilityEvents.createdAt,
        })
        .from(reliabilityEvents)
        .where(eq(reliabilityEvents.workerId, workerId))
        .orderBy(desc(reliabilityEvents.createdAt))
        .limit(50),
    ]);

    return {
      workerId,
      score: numberFromNumeric(profile.score, 100),
      activeStrikeWeight: activeStrikeRows.reduce((sum, item) => sum + item.weight, 0),
      strikes: activeStrikeRows,
      sanctions: activeSanctionRows,
      recentEvents: recentEvents.map((event) => ({
        ...event,
        scoreDelta: numberFromNumeric(event.scoreDelta),
        previousScore: numberFromNumeric(event.previousScore),
        resultingScore: numberFromNumeric(event.resultingScore),
      })),
    };
  }
}
