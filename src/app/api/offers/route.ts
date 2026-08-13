import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { db } from "@/db";
import { shiftOffers, shiftSlots, shifts } from "@/db/schema/shifts";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "shift.accept");
    const offers = await db
      .select({
        offerId: shiftOffers.id,
        shiftSlotId: shiftOffers.shiftSlotId,
        offeredPayRials: shiftOffers.offeredPayRials,
        status: shiftOffers.status,
        expiresAt: shiftOffers.expiresAt,
        createdAt: shiftOffers.createdAt,
        shiftTitle: shifts.title,
        hourlyPayRials: shifts.hourlyPayRials,
        locationName: shifts.locationName,
        startAt: shifts.startAt,
        endAt: shifts.endAt,
      })
      .from(shiftOffers)
      .innerJoin(shiftSlots, eq(shiftOffers.shiftSlotId, shiftSlots.id))
      .innerJoin(shifts, eq(shiftSlots.shiftId, shifts.id))
      .where(and(eq(shiftOffers.workerId, session.userId), eq(shiftOffers.status, "PENDING")));

    return NextResponse.json({ success: true, offers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در دریافت پیشنهادهای شیفت کاری";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
