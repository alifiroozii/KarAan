import crypto from "crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { backfillOfferLinks, backfillRequests } from "@/db/schema/backfill";
import { shiftAssignments, shiftOffers, shiftSlots } from "@/db/schema/shifts";
import { auditLogs } from "@/db/schema/system";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";

export interface AtomicAcceptResult {
  success: boolean;
  assignmentId?: string;
  message: string;
  backfillRequestId?: string;
  urgentBonusRials?: string;
}

export class ShiftOfferService {
  /**
   * Atomically accepts one Offer and consumes the Slot exactly once.
   *
   * Slot fill, Assignment creation, Offer acceptance, sibling expiration and
   * Backfill completion all live in the same transaction. Retrying an already
   * accepted Offer is idempotent when the corresponding Assignment exists.
   */
  async acceptOfferAtomic(offerId: string, workerId: string): Promise<AtomicAcceptResult> {
    const now = new Date();
    let result: AtomicAcceptResult | null = null;
    let realtime:
      | {
          assignmentId: string;
          shiftId: string;
          shiftSlotId: string;
          backfillRequestId: string | null;
          urgentBonusRials: bigint;
        }
      | null = null;

    await db.transaction(async (tx) => {
      const [offer] = await tx
        .select()
        .from(shiftOffers)
        .where(eq(shiftOffers.id, offerId))
        .limit(1);

      if (!offer) {
        throw new AppError("پیشنهاد شیفت کاری پیدا نشد.", "NOT_FOUND", 404);
      }
      if (offer.workerId !== workerId) {
        throw new AppError("این پیشنهاد مربوط به شما نمی‌باشد.", "FORBIDDEN", 403);
      }

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`shift-slot:${offer.shiftSlotId}`}))`
      );

      const [freshOffer] = await tx
        .select()
        .from(shiftOffers)
        .where(eq(shiftOffers.id, offerId))
        .limit(1);
      if (!freshOffer) throw new AppError("پیشنهاد پیدا نشد.", "NOT_FOUND", 404);

      if (freshOffer.status === "ACCEPTED") {
        const [existingAssignment] = await tx
          .select({ id: shiftAssignments.id })
          .from(shiftAssignments)
          .where(
            and(
              eq(shiftAssignments.shiftSlotId, freshOffer.shiftSlotId),
              eq(shiftAssignments.workerId, workerId)
            )
          )
          .limit(1);
        if (existingAssignment) {
          result = {
            success: true,
            assignmentId: existingAssignment.id,
            message: "این پیشنهاد قبلاً با موفقیت پذیرفته شده است.",
          };
          return;
        }
        throw new AppError("وضعیت پیشنهاد با Assignment سازگار نیست.", "CONFLICT", 409);
      }

      if (freshOffer.status !== "PENDING") {
        throw new AppError("این پیشنهاد دیگر قابل پذیرش نیست.", "CONFLICT", 409);
      }
      if (freshOffer.expiresAt <= now) {
        await tx
          .update(shiftOffers)
          .set({ status: "EXPIRED" })
          .where(
            and(eq(shiftOffers.id, freshOffer.id), eq(shiftOffers.status, "PENDING"))
          );
        throw new AppError("مهلت پاسخگویی به این پیشنهاد به پایان رسیده است.", "BAD_REQUEST", 410);
      }

      const [slot] = await tx
        .select()
        .from(shiftSlots)
        .where(eq(shiftSlots.id, freshOffer.shiftSlotId))
        .limit(1);
      if (!slot) throw new AppError("ظرفیت شیفت پیدا نشد.", "NOT_FOUND", 404);

      const [backfillLink] = await tx
        .select({
          requestId: backfillRequests.id,
          status: backfillRequests.status,
          urgentBonusRials: backfillRequests.urgentBonusRials,
          sourceAssignmentId: backfillRequests.sourceAssignmentId,
        })
        .from(backfillOfferLinks)
        .innerJoin(
          backfillRequests,
          eq(backfillRequests.id, backfillOfferLinks.backfillRequestId)
        )
        .where(eq(backfillOfferLinks.offerId, offerId))
        .limit(1);

      if (backfillLink && backfillLink.status === "FILLED") {
        throw new AppError("این جایگزینی قبلاً تکمیل شده است.", "CONFLICT", 409);
      }

      const filled = await tx
        .update(shiftSlots)
        .set({ status: "FILLED" })
        .where(
          and(eq(shiftSlots.id, freshOffer.shiftSlotId), eq(shiftSlots.status, "OPEN"))
        )
        .returning({ id: shiftSlots.id });

      if (filled.length !== 1) {
        await tx
          .update(shiftOffers)
          .set({ status: "EXPIRED" })
          .where(
            and(eq(shiftOffers.id, freshOffer.id), eq(shiftOffers.status, "PENDING"))
          );
        result = {
          success: false,
          message: "ظرفیت تکمیل شده است. این اسلات توسط نیروی دیگری رزرو شد.",
        };
        return;
      }

      const assignmentId = `asgn_${crypto.randomUUID()}`;
      const urgentBonusRials = backfillLink?.urgentBonusRials ?? 0n;
      await tx.insert(shiftAssignments).values({
        id: assignmentId,
        shiftSlotId: slot.id,
        shiftId: slot.shiftId,
        workerId,
        state: "ACCEPTED",
        agreedBonusRials: urgentBonusRials,
        actualPayRials: freshOffer.offeredPayRials,
        createdAt: now,
        updatedAt: now,
      });

      const accepted = await tx
        .update(shiftOffers)
        .set({ status: "ACCEPTED" })
        .where(and(eq(shiftOffers.id, freshOffer.id), eq(shiftOffers.status, "PENDING")))
        .returning({ id: shiftOffers.id });
      if (accepted.length !== 1) {
        throw new AppError("پذیرش Offer همزمان تغییر کرده است.", "CONFLICT", 409);
      }

      await tx
        .update(shiftOffers)
        .set({ status: "EXPIRED" })
        .where(
          and(
            eq(shiftOffers.shiftSlotId, slot.id),
            eq(shiftOffers.status, "PENDING"),
            ne(shiftOffers.id, freshOffer.id)
          )
        );

      if (backfillLink) {
        await tx
          .update(backfillRequests)
          .set({
            status: "FILLED",
            filledByAssignmentId: assignmentId,
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(backfillRequests.id, backfillLink.requestId));

        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: workerId,
          entityName: "backfill_request",
          entityId: backfillLink.requestId,
          action: "BACKFILL_FILLED",
          details: {
            offerId,
            assignmentId,
            shiftId: slot.shiftId,
            shiftSlotId: slot.id,
            workerId,
            sourceAssignmentId: backfillLink.sourceAssignmentId,
            urgentBonusRials: urgentBonusRials.toString(),
          },
        });
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: workerId,
        entityName: "shift_offer",
        entityId: offerId,
        action: "OFFER_ACCEPTED",
        details: {
          assignmentId,
          shiftId: slot.shiftId,
          shiftSlotId: slot.id,
          backfillRequestId: backfillLink?.requestId ?? null,
          agreedBonusRials: urgentBonusRials.toString(),
        },
      });

      result = {
        success: true,
        assignmentId,
        message: backfillLink
          ? "پیشنهاد جایگزینی فوری با موفقیت پذیرفته شد."
          : "شیفت کاری با موفقیت برای شما ثبت شد.",
        backfillRequestId: backfillLink?.requestId,
        urgentBonusRials: urgentBonusRials.toString(),
      };
      realtime = {
        assignmentId,
        shiftId: slot.shiftId,
        shiftSlotId: slot.id,
        backfillRequestId: backfillLink?.requestId ?? null,
        urgentBonusRials,
      };
    });

    if (!result) {
      throw new AppError("پذیرش پیشنهاد تکمیل نشد.", "INTERNAL_SERVER_ERROR", 500);
    }

    const finalResult = result as AtomicAcceptResult;
    const realtimePayload = realtime as
      | {
          assignmentId: string;
          shiftId: string;
          shiftSlotId: string;
          backfillRequestId: string | null;
          urgentBonusRials: bigint;
        }
      | null;

    if (finalResult.success && realtimePayload) {
      publishRealtimeEvent("user", workerId, "offer.accepted", {
        offerId,
        assignmentId: realtimePayload.assignmentId,
      });
      publishRealtimeEvent("assignment", realtimePayload.assignmentId, "assignment.updated", {
        assignmentId: realtimePayload.assignmentId,
        shiftId: realtimePayload.shiftId,
        state: "ACCEPTED",
      });
      publishRealtimeEvent("shift", realtimePayload.shiftId, "assignment.updated", {
        assignmentId: realtimePayload.assignmentId,
        shiftId: realtimePayload.shiftId,
        state: "ACCEPTED",
      });
      if (realtimePayload.backfillRequestId) {
        publishRealtimeEvent("shift", realtimePayload.shiftId, "backfill.filled", {
          backfillRequestId: realtimePayload.backfillRequestId,
          shiftId: realtimePayload.shiftId,
          shiftSlotId: realtimePayload.shiftSlotId,
          assignmentId: realtimePayload.assignmentId,
        });
      }
    }

    return finalResult;
  }

  async declineOffer(offerId: string, workerId: string) {
    const [offer] = await db
      .select()
      .from(shiftOffers)
      .where(eq(shiftOffers.id, offerId))
      .limit(1);

    if (!offer || offer.workerId !== workerId) {
      throw new AppError("پیشنهاد یافت نشد.", "NOT_FOUND", 404);
    }
    if (offer.status === "DECLINED") {
      return { success: true, message: "این پیشنهاد قبلاً رد شده است." };
    }
    if (offer.status !== "PENDING") {
      throw new AppError("این پیشنهاد دیگر قابل رد کردن نیست.", "CONFLICT", 409);
    }

    await db
      .update(shiftOffers)
      .set({ status: "DECLINED" })
      .where(and(eq(shiftOffers.id, offer.id), eq(shiftOffers.status, "PENDING")));

    return { success: true, message: "پیشنهاد رد شد." };
  }
}
