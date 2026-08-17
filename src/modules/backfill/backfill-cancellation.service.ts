import crypto from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { backfillOfferLinks, backfillRequests } from "@/db/schema/backfill";
import { shiftOffers } from "@/db/schema/shifts";
import { auditLogs } from "@/db/schema/system";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";

const ACTIVE = ["REQUESTED", "DISPATCHING", "OFFERED"] as const;

export class BackfillCancellationService {
  async cancelForSourceAssignment(
    sourceAssignmentId: string,
    reason: string,
    actorId?: string | null
  ) {
    const now = new Date();
    let cancelled:
      | {
          id: string;
          shiftId: string;
          shiftSlotId: string;
        }
      | null = null;

    await db.transaction(async (tx) => {
      const [request] = await tx
        .select()
        .from(backfillRequests)
        .where(eq(backfillRequests.sourceAssignmentId, sourceAssignmentId))
        .limit(1);
      if (!request || !ACTIVE.includes(request.status as (typeof ACTIVE)[number])) return;

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`backfill:${request.shiftSlotId}`}))`
      );

      const [fresh] = await tx
        .select()
        .from(backfillRequests)
        .where(eq(backfillRequests.id, request.id))
        .limit(1);
      if (!fresh || !ACTIVE.includes(fresh.status as (typeof ACTIVE)[number])) return;

      const linkedOffers = await tx
        .select({ offerId: backfillOfferLinks.offerId })
        .from(backfillOfferLinks)
        .where(eq(backfillOfferLinks.backfillRequestId, fresh.id));

      if (linkedOffers.length > 0) {
        await tx
          .update(shiftOffers)
          .set({ status: "EXPIRED" })
          .where(
            and(
              inArray(
                shiftOffers.id,
                linkedOffers.map((item) => item.offerId)
              ),
              eq(shiftOffers.status, "PENDING")
            )
          );
      }

      await tx
        .update(backfillRequests)
        .set({ status: "CANCELLED", completedAt: now, updatedAt: now })
        .where(eq(backfillRequests.id, fresh.id));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorId ?? null,
        entityName: "backfill_request",
        entityId: fresh.id,
        action: "BACKFILL_CANCELLED",
        details: {
          sourceAssignmentId,
          reason,
          expiredPendingOffers: linkedOffers.length,
        },
      });

      cancelled = {
        id: fresh.id,
        shiftId: fresh.shiftId,
        shiftSlotId: fresh.shiftSlotId,
      };
    });

    const finalCancelled = cancelled as
      | { id: string; shiftId: string; shiftSlotId: string }
      | null;
    if (finalCancelled) {
      publishRealtimeEvent("shift", finalCancelled.shiftId, "backfill.cancelled", {
        backfillRequestId: finalCancelled.id,
        shiftId: finalCancelled.shiftId,
        shiftSlotId: finalCancelled.shiftSlotId,
        reason,
      });
    }

    return finalCancelled;
  }
}
