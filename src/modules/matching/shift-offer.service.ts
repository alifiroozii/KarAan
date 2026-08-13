import { db } from "@/db";
import { shiftSlots, shiftOffers, shiftAssignments } from "@/db/schema/shifts";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export interface AtomicAcceptResult {
  success: boolean;
  assignmentId?: string;
  message: string;
}

export class ShiftOfferService {
  /**
   * Atomic Offer Acceptance with Strict Concurrency & Race Condition Guard
   */
  async acceptOfferAtomic(offerId: string, workerId: string): Promise<AtomicAcceptResult> {
    const [offer] = await db
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

    if (offer.status !== "PENDING") {
      throw new AppError("این پیشنهاد قبلاً پاسخ داده شده یا منقضی شده است.", "CONFLICT", 400);
    }

    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await db
        .update(shiftOffers)
        .set({ status: "EXPIRED" })
        .where(eq(shiftOffers.id, offer.id));

      throw new AppError("مهلت پاسخگویی به این پیشنهاد به پایان رسیده است.", "BAD_REQUEST", 410);
    }

    // Atomic Slot Lock & Race Condition Resolution
    // Update ShiftSlot status from OPEN to FILLED atomically only if it is currently OPEN
    const updatedSlots = await db
      .update(shiftSlots)
      .set({
        status: "FILLED",
      })
      .where(and(eq(shiftSlots.id, offer.shiftSlotId), eq(shiftSlots.status, "OPEN")))
      .returning();

    if (updatedSlots.length === 0) {
      // Race Condition Loss: Slot was filled by another worker a split second earlier
      await db
        .update(shiftOffers)
        .set({ status: "EXPIRED" })
        .where(eq(shiftOffers.id, offer.id));

      return {
        success: false,
        message: "ظرفیت تکمیل شده است. این اسلات توسط نیروی دیگری رزرو شد.",
      };
    }

    const filledSlot = updatedSlots[0];

    // Create Shift Assignment
    const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(shiftAssignments).values({
      id: assignmentId,
      shiftSlotId: filledSlot.id,
      shiftId: filledSlot.shiftId,
      workerId,
      state: "ACCEPTED",
      actualPayRials: offer.offeredPayRials,
    });

    // Update Offer status to ACCEPTED
    await db
      .update(shiftOffers)
      .set({ status: "ACCEPTED" })
      .where(eq(shiftOffers.id, offer.id));

    return {
      success: true,
      assignmentId,
      message: "شیفت کاری با موفقیت برای شما ثبت شد.",
    };
  }

  /**
   * Decline Shift Offer
   */
  async declineOffer(offerId: string, workerId: string) {
    const [offer] = await db
      .select()
      .from(shiftOffers)
      .where(eq(shiftOffers.id, offerId))
      .limit(1);

    if (!offer || offer.workerId !== workerId) {
      throw new AppError("پیشنهاد یافت نشد.", "NOT_FOUND", 404);
    }

    await db
      .update(shiftOffers)
      .set({ status: "DECLINED" })
      .where(eq(shiftOffers.id, offer.id));

    return { success: true, message: "پیشنهاد رد شد." };
  }
}
