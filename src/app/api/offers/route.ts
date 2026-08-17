import { NextRequest } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { backfillOfferLinks, backfillRequests } from "@/db/schema/backfill";
import { shiftOffers, shiftSlots, shifts } from "@/db/schema/shifts";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { requirePermission } from "@/modules/auth/auth.middleware";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "shift.accept");
    const rows = await db
      .select({
        offerId: shiftOffers.id,
        shiftSlotId: shiftOffers.shiftSlotId,
        offeredPayRials: shiftOffers.offeredPayRials,
        status: shiftOffers.status,
        expiresAt: shiftOffers.expiresAt,
        createdAt: shiftOffers.createdAt,
        shiftId: shifts.id,
        shiftTitle: shifts.title,
        hourlyPayRials: shifts.hourlyPayRials,
        locationName: shifts.locationName,
        startAt: shifts.startAt,
        endAt: shifts.endAt,
        backfillRequestId: backfillRequests.id,
        urgentBonusRials: backfillRequests.urgentBonusRials,
      })
      .from(shiftOffers)
      .innerJoin(shiftSlots, eq(shiftOffers.shiftSlotId, shiftSlots.id))
      .innerJoin(shifts, eq(shiftSlots.shiftId, shifts.id))
      .leftJoin(backfillOfferLinks, eq(backfillOfferLinks.offerId, shiftOffers.id))
      .leftJoin(
        backfillRequests,
        eq(backfillRequests.id, backfillOfferLinks.backfillRequestId)
      )
      .where(
        and(
          eq(shiftOffers.workerId, session.userId),
          eq(shiftOffers.status, "PENDING"),
          gt(shiftOffers.expiresAt, new Date())
        )
      );

    return createSuccessResponse(
      rows.map((row) => ({
        ...row,
        offeredPayRials: row.offeredPayRials.toString(),
        hourlyPayRials: row.hourlyPayRials.toString(),
        urgentBonusRials: (row.urgentBonusRials ?? 0n).toString(),
        isBackfill: Boolean(row.backfillRequestId),
      }))
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
