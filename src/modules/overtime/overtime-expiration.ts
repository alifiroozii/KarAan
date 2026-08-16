import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { overtimeRequests } from "@/db/schema/overtime";
import { auditLogs } from "@/db/schema/system";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";

export async function expireOvertimeRequest(id: string): Promise<boolean> {
  const now = new Date();
  let expired: typeof overtimeRequests.$inferSelect | null = null;

  await db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(overtimeRequests)
      .where(eq(overtimeRequests.id, id))
      .limit(1);

    if (!item || item.status !== "PENDING" || item.expiresAt > now) return;

    const [updated] = await tx
      .update(overtimeRequests)
      .set({ status: "EXPIRED", updatedAt: now })
      .where(
        and(
          eq(overtimeRequests.id, id),
          eq(overtimeRequests.status, "PENDING")
        )
      )
      .returning();

    if (!updated) return;
    expired = updated;

    await tx.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: null,
      entityName: "overtime_request",
      entityId: id,
      action: "OVERTIME_EXPIRED",
      details: {
        assignmentId: updated.assignmentId,
        expiredAt: now.toISOString(),
      },
    });
  });

  if (!expired) return false;

  const item = expired as typeof overtimeRequests.$inferSelect;
  const payload = {
    overtimeRequestId: item.id,
    assignmentId: item.assignmentId,
    shiftId: item.shiftId,
    workerId: item.workerId,
  };
  publishRealtimeEvent("assignment", item.assignmentId, "overtime.expired", payload);
  publishRealtimeEvent("shift", item.shiftId, "overtime.expired", payload);
  publishRealtimeEvent("user", item.workerId, "overtime.expired", payload);
  return true;
}
