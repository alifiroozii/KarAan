import crypto from "crypto";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { backfillOfferLinks, backfillRequests } from "@/db/schema/backfill";
import { shiftAssignments, shiftOffers, shiftSlots, shifts } from "@/db/schema/shifts";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { getSMSAdapter } from "@/infrastructure/sms";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { MatchingService } from "@/modules/matching/matching.service";
import {
  DEFAULT_BACKFILL_POLICY,
  normalizeBackfillPolicy,
  type BackfillPolicy,
} from "./backfill-policy";

export type BackfillTrigger =
  | "NO_SHOW"
  | "WORKER_CANCELLATION"
  | "EMPLOYER_CANCELLATION"
  | "MANUAL";

const ACTIVE_BACKFILL_STATUSES = ["REQUESTED", "DISPATCHING", "OFFERED"] as const;

export interface BackfillDispatchResult {
  requestId: string;
  status: "OFFERED" | "FILLED" | "EXHAUSTED" | "REQUESTED" | "CANCELLED";
  offersCreatedNow: number;
  expiresAt: Date | null;
  shouldRetry: boolean;
  retryAfterSeconds: number;
  idempotent?: boolean;
}

export class BackfillService {
  private readonly matcher = new MatchingService();
  private readonly sms = getSMSAdapter();

  private async readPolicy(): Promise<BackfillPolicy> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, "backfill.policy"))
      .limit(1);
    return normalizeBackfillPolicy(setting?.value ?? DEFAULT_BACKFILL_POLICY);
  }

  async requestForAssignment(input: {
    sourceAssignmentId: string;
    trigger: Exclude<BackfillTrigger, "MANUAL">;
    actorId?: string | null;
  }) {
    const policy = await this.readPolicy();
    const [source] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, input.sourceAssignmentId))
      .limit(1);

    if (!source) throw new AppError("Assignment مبدا Backfill پیدا نشد.", "NOT_FOUND", 404);
    if (!source.assignment.shiftSlotId) {
      return { request: null, created: false, reason: "SOURCE_HAS_NO_SLOT" as const };
    }

    const requestId = `bf_${crypto.randomUUID()}`;
    let created = false;
    let selectedRequestId = requestId;
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`backfill:${source.assignment.shiftSlotId}`}))`
      );

      const [slot] = await tx
        .select({ status: shiftSlots.status })
        .from(shiftSlots)
        .where(eq(shiftSlots.id, source.assignment.shiftSlotId!))
        .limit(1);
      if (!slot) throw new AppError("Slot برای Backfill پیدا نشد.", "NOT_FOUND", 404);
      if (slot.status !== "OPEN") return;

      const [existingBySource] = await tx
        .select()
        .from(backfillRequests)
        .where(eq(backfillRequests.sourceAssignmentId, input.sourceAssignmentId))
        .limit(1);
      if (existingBySource) {
        selectedRequestId = existingBySource.id;
        return;
      }

      const [existingActive] = await tx
        .select()
        .from(backfillRequests)
        .where(
          and(
            eq(backfillRequests.shiftSlotId, source.assignment.shiftSlotId!),
            inArray(backfillRequests.status, [...ACTIVE_BACKFILL_STATUSES])
          )
        )
        .limit(1);
      if (existingActive) {
        selectedRequestId = existingActive.id;
        return;
      }

      await tx.insert(backfillRequests).values({
        id: requestId,
        shiftId: source.shift.id,
        shiftSlotId: source.assignment.shiftSlotId!,
        sourceAssignmentId: input.sourceAssignmentId,
        trigger: input.trigger,
        status: "REQUESTED",
        urgentBonusRials: policy.urgentBonusRials,
        maxCandidates: policy.maxCandidates,
        offerTtlSeconds: policy.offerTtlSeconds,
        maxDispatchAttempts: policy.maxDispatchAttempts,
        dispatchAttemptCount: 0,
        offersCreated: 0,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorId ?? null,
        entityName: "backfill_request",
        entityId: requestId,
        action: "BACKFILL_REQUESTED",
        details: {
          shiftId: source.shift.id,
          shiftSlotId: source.assignment.shiftSlotId,
          sourceAssignmentId: input.sourceAssignmentId,
          trigger: input.trigger,
          urgentBonusRials: policy.urgentBonusRials.toString(),
          maxCandidates: policy.maxCandidates,
          offerTtlSeconds: policy.offerTtlSeconds,
          maxDispatchAttempts: policy.maxDispatchAttempts,
        },
      });
      created = true;
    });

    const [request] = await db
      .select()
      .from(backfillRequests)
      .where(eq(backfillRequests.id, selectedRequestId))
      .limit(1);

    if (created && request) {
      publishRealtimeEvent("shift", source.shift.id, "backfill.requested", {
        shiftId: source.shift.id,
        neededSlots: 1,
      });
    }

    return {
      request: request ?? null,
      created,
      reason: request ? null : ("SLOT_NOT_OPEN" as const),
    };
  }

  async dispatch(requestId: string): Promise<BackfillDispatchResult> {
    const [initial] = await db
      .select({ request: backfillRequests, slot: shiftSlots, shift: shifts })
      .from(backfillRequests)
      .innerJoin(shiftSlots, eq(shiftSlots.id, backfillRequests.shiftSlotId))
      .innerJoin(shifts, eq(shifts.id, backfillRequests.shiftId))
      .where(eq(backfillRequests.id, requestId))
      .limit(1);
    if (!initial) throw new AppError("Backfill Request پیدا نشد.", "NOT_FOUND", 404);

    if (initial.request.status === "FILLED" || initial.slot.status === "FILLED") {
      const completion = await this.markFilledIfNeeded(requestId);
      const completionStatus = completion?.status === "CANCELLED" ? "CANCELLED" : "FILLED";
      return {
        requestId,
        status: completionStatus,
        offersCreatedNow: 0,
        expiresAt: null,
        shouldRetry: false,
        retryAfterSeconds: 0,
        idempotent: true,
      };
    }
    if (initial.request.status === "CANCELLED" || initial.request.status === "EXHAUSTED") {
      return {
        requestId,
        status: initial.request.status,
        offersCreatedNow: 0,
        expiresAt: null,
        shouldRetry: false,
        retryAfterSeconds: 0,
        idempotent: true,
      };
    }

    const linkedPending = await db
      .select({ id: shiftOffers.id, expiresAt: shiftOffers.expiresAt })
      .from(backfillOfferLinks)
      .innerJoin(shiftOffers, eq(shiftOffers.id, backfillOfferLinks.offerId))
      .where(
        and(
          eq(backfillOfferLinks.backfillRequestId, requestId),
          eq(shiftOffers.status, "PENDING")
        )
      );
    const activePending = linkedPending.filter((offer) => offer.expiresAt > new Date());
    if (activePending.length > 0) {
      return {
        requestId,
        status: "OFFERED",
        offersCreatedNow: 0,
        expiresAt: activePending.reduce(
          (latest, item) => (item.expiresAt > latest ? item.expiresAt : latest),
          activePending[0].expiresAt
        ),
        shouldRetry: false,
        retryAfterSeconds: 0,
        idempotent: true,
      };
    }

    const existingAssignments = await db
      .select({ workerId: shiftAssignments.workerId })
      .from(shiftAssignments)
      .where(eq(shiftAssignments.shiftId, initial.shift.id));
    const existingOfferWorkers = await db
      .select({ workerId: shiftOffers.workerId })
      .from(shiftOffers)
      .where(eq(shiftOffers.shiftSlotId, initial.request.shiftSlotId));

    const excludedWorkerIds = Array.from(
      new Set([
        ...existingAssignments.map((row) => row.workerId),
        ...existingOfferWorkers.map((row) => row.workerId),
      ])
    );

    const candidates = await this.matcher.findQualifiedWorkers({
      shiftId: initial.shift.id,
      maxDistanceKm: (await this.readPolicy()).maxDistanceKm,
      limit: initial.request.maxCandidates,
      excludeWorkerIds: excludedWorkerIds,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + initial.request.offerTtlSeconds * 1000);
    const createdOffers: Array<{ id: string; workerId: string; phone: string }> = [];
    let status: BackfillDispatchResult["status"] = "REQUESTED";
    let attemptCount = initial.request.dispatchAttemptCount;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`backfill:${initial.request.shiftSlotId}`}))`
      );

      const [fresh] = await tx
        .select({ request: backfillRequests, slot: shiftSlots })
        .from(backfillRequests)
        .innerJoin(shiftSlots, eq(shiftSlots.id, backfillRequests.shiftSlotId))
        .where(eq(backfillRequests.id, requestId))
        .limit(1);
      if (!fresh) throw new AppError("Backfill Request پیدا نشد.", "NOT_FOUND", 404);

      if (fresh.slot.status !== "OPEN") {
        status = "FILLED";
        await tx
          .update(backfillRequests)
          .set({ status: "FILLED", completedAt: now, updatedAt: now })
          .where(eq(backfillRequests.id, requestId));
        return;
      }
      if (!["REQUESTED", "DISPATCHING", "OFFERED"].includes(fresh.request.status)) {
        status = fresh.request.status as BackfillDispatchResult["status"];
        return;
      }

      attemptCount = fresh.request.dispatchAttemptCount + 1;
      await tx
        .update(backfillRequests)
        .set({
          status: "DISPATCHING",
          dispatchAttemptCount: attemptCount,
          lastDispatchedAt: now,
          updatedAt: now,
        })
        .where(eq(backfillRequests.id, requestId));

      for (const candidate of candidates) {
        const [alreadyOffered] = await tx
          .select({ id: shiftOffers.id })
          .from(shiftOffers)
          .where(
            and(
              eq(shiftOffers.shiftSlotId, fresh.request.shiftSlotId),
              eq(shiftOffers.workerId, candidate.workerId)
            )
          )
          .limit(1);
        if (alreadyOffered) continue;

        const offerId = `offer_${crypto.randomUUID()}`;
        await tx.insert(shiftOffers).values({
          id: offerId,
          shiftSlotId: fresh.request.shiftSlotId,
          workerId: candidate.workerId,
          offeredPayRials: initial.shift.hourlyPayRials,
          status: "PENDING",
          expiresAt,
          createdAt: now,
        });
        await tx.insert(backfillOfferLinks).values({
          id: `bfo_${crypto.randomUUID()}`,
          backfillRequestId: requestId,
          offerId,
          createdAt: now,
        });
        createdOffers.push({ id: offerId, workerId: candidate.workerId, phone: candidate.phone });
      }

      const totalOffersCreated = fresh.request.offersCreated + createdOffers.length;
      const exhausted = createdOffers.length === 0 && attemptCount >= fresh.request.maxDispatchAttempts;
      status = exhausted ? "EXHAUSTED" : createdOffers.length > 0 ? "OFFERED" : "REQUESTED";

      await tx
        .update(backfillRequests)
        .set({
          status,
          offersCreated: totalOffersCreated,
          completedAt: exhausted ? now : null,
          updatedAt: now,
        })
        .where(eq(backfillRequests.id, requestId));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: null,
        entityName: "backfill_request",
        entityId: requestId,
        action: createdOffers.length > 0 ? "BACKFILL_OFFERS_DISPATCHED" : "BACKFILL_DISPATCH_EMPTY",
        details: {
          shiftId: initial.shift.id,
          shiftSlotId: fresh.request.shiftSlotId,
          attemptCount,
          candidateCount: candidates.length,
          offersCreatedNow: createdOffers.length,
          totalOffersCreated,
          status,
          expiresAt: createdOffers.length > 0 ? expiresAt.toISOString() : null,
        },
      });
    });

    const finalStatus = status as BackfillDispatchResult["status"];

    for (const offer of createdOffers) {
      publishRealtimeEvent("user", offer.workerId, "offer.created", {
        offerId: offer.id,
        shiftSlotId: initial.request.shiftSlotId,
        workerId: offer.workerId,
      });
      try {
        const bonusText =
          initial.request.urgentBonusRials > 0n
            ? ` همراه با پاداش فوری ${initial.request.urgentBonusRials.toString()} ریال`
            : "";
        await this.sms.sendReminder(
          offer.phone,
          `پیشنهاد فوری کارآن برای شیفت «${initial.shift.title}»${bonusText}. فرصت پاسخ محدود است.`
        );
      } catch (error) {
        console.error("[Backfill Offer SMS Error]", {
          requestId,
          offerId: offer.id,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    if (createdOffers.length > 0) {
      publishRealtimeEvent("shift", initial.shift.id, "backfill.offers_dispatched", {
        backfillRequestId: requestId,
        shiftId: initial.shift.id,
        shiftSlotId: initial.request.shiftSlotId,
        offersCreated: createdOffers.length,
        expiresAt: expiresAt.toISOString(),
      });
    } else if (finalStatus === "EXHAUSTED") {
      publishRealtimeEvent("shift", initial.shift.id, "backfill.exhausted", {
        backfillRequestId: requestId,
        shiftId: initial.shift.id,
        shiftSlotId: initial.request.shiftSlotId,
      });
    }

    const policy = await this.readPolicy();
    return {
      requestId,
      status: finalStatus,
      offersCreatedNow: createdOffers.length,
      expiresAt: createdOffers.length > 0 ? expiresAt : null,
      shouldRetry: finalStatus === "REQUESTED" && attemptCount < initial.request.maxDispatchAttempts,
      retryAfterSeconds: policy.retryDelaySeconds,
    };
  }

  async reconcile(requestId: string, now = new Date()): Promise<BackfillDispatchResult> {
    const [row] = await db
      .select({ request: backfillRequests, slot: shiftSlots, shift: shifts })
      .from(backfillRequests)
      .innerJoin(shiftSlots, eq(shiftSlots.id, backfillRequests.shiftSlotId))
      .innerJoin(shifts, eq(shifts.id, backfillRequests.shiftId))
      .where(eq(backfillRequests.id, requestId))
      .limit(1);
    if (!row) throw new AppError("Backfill Request پیدا نشد.", "NOT_FOUND", 404);

    if (row.slot.status === "FILLED" || row.request.status === "FILLED") {
      const completion = await this.markFilledIfNeeded(requestId);
      const completionStatus = completion?.status === "CANCELLED" ? "CANCELLED" : "FILLED";
      return {
        requestId,
        status: completionStatus,
        offersCreatedNow: 0,
        expiresAt: null,
        shouldRetry: false,
        retryAfterSeconds: 0,
      };
    }
    if (row.request.status === "EXHAUSTED" || row.request.status === "CANCELLED") {
      return {
        requestId,
        status: row.request.status,
        offersCreatedNow: 0,
        expiresAt: null,
        shouldRetry: false,
        retryAfterSeconds: 0,
      };
    }

    const linkedOffers = await db
      .select({ id: shiftOffers.id, status: shiftOffers.status, expiresAt: shiftOffers.expiresAt })
      .from(backfillOfferLinks)
      .innerJoin(shiftOffers, eq(shiftOffers.id, backfillOfferLinks.offerId))
      .where(eq(backfillOfferLinks.backfillRequestId, requestId));

    const expiredIds = linkedOffers
      .filter((item) => item.status === "PENDING" && item.expiresAt <= now)
      .map((item) => item.id);
    if (expiredIds.length > 0) {
      await db
        .update(shiftOffers)
        .set({ status: "EXPIRED" })
        .where(inArray(shiftOffers.id, expiredIds));
    }

    const stillPending = linkedOffers.filter(
      (item) => item.status === "PENDING" && item.expiresAt > now
    );
    if (stillPending.length > 0) {
      const expiresAt = stillPending.reduce(
        (latest, item) => (item.expiresAt > latest ? item.expiresAt : latest),
        stillPending[0].expiresAt
      );
      return {
        requestId,
        status: "OFFERED",
        offersCreatedNow: 0,
        expiresAt,
        shouldRetry: false,
        retryAfterSeconds: 0,
      };
    }

    const exhausted = row.request.dispatchAttemptCount >= row.request.maxDispatchAttempts;
    await db
      .update(backfillRequests)
      .set({
        status: exhausted ? "EXHAUSTED" : "REQUESTED",
        completedAt: exhausted ? now : null,
        updatedAt: now,
      })
      .where(eq(backfillRequests.id, requestId));

    if (exhausted) {
      publishRealtimeEvent("shift", row.shift.id, "backfill.exhausted", {
        backfillRequestId: requestId,
        shiftId: row.shift.id,
        shiftSlotId: row.request.shiftSlotId,
      });
    }

    const policy = await this.readPolicy();
    return {
      requestId,
      status: exhausted ? "EXHAUSTED" : "REQUESTED",
      offersCreatedNow: 0,
      expiresAt: null,
      shouldRetry: !exhausted,
      retryAfterSeconds: policy.retryDelaySeconds,
    };
  }

  async markFilledIfNeeded(requestId: string, assignmentId?: string) {
    const now = new Date();
    const [request] = await db
      .select()
      .from(backfillRequests)
      .where(eq(backfillRequests.id, requestId))
      .limit(1);
    if (!request) return null;
    if (request.status === "FILLED" || request.status === "CANCELLED") return request;

    let filledByAssignmentId = assignmentId ?? null;
    if (!filledByAssignmentId) {
      const [assignment] = await db
        .select({ id: shiftAssignments.id })
        .from(shiftAssignments)
        .where(
          and(
            eq(shiftAssignments.shiftSlotId, request.shiftSlotId),
            request.sourceAssignmentId
              ? ne(shiftAssignments.id, request.sourceAssignmentId)
              : sql`true`
          )
        )
        .limit(1);
      filledByAssignmentId = assignment?.id ?? null;
    }

    if (!filledByAssignmentId && request.sourceAssignmentId) {
      const [cancelled] = await db
        .update(backfillRequests)
        .set({
          status: "CANCELLED",
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(backfillRequests.id, requestId))
        .returning();

      if (cancelled) {
        publishRealtimeEvent("shift", cancelled.shiftId, "backfill.cancelled", {
          backfillRequestId: cancelled.id,
          shiftId: cancelled.shiftId,
          shiftSlotId: cancelled.shiftSlotId,
          reason: "SLOT_FILLED_WITHOUT_REPLACEMENT_ASSIGNMENT",
        });
      }
      return cancelled ?? null;
    }

    const [updated] = await db
      .update(backfillRequests)
      .set({
        status: "FILLED",
        filledByAssignmentId,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(backfillRequests.id, requestId))
      .returning();

    if (updated) {
      publishRealtimeEvent("shift", updated.shiftId, "backfill.filled", {
        backfillRequestId: updated.id,
        shiftId: updated.shiftId,
        shiftSlotId: updated.shiftSlotId,
        assignmentId: filledByAssignmentId ?? "",
      });
    }
    return updated ?? null;
  }

  async getById(requestId: string) {
    const [request] = await db
      .select()
      .from(backfillRequests)
      .where(eq(backfillRequests.id, requestId))
      .limit(1);
    if (!request) throw new AppError("Backfill Request پیدا نشد.", "NOT_FOUND", 404);
    return {
      ...request,
      urgentBonusRials: request.urgentBonusRials.toString(),
    };
  }
}
