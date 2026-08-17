import crypto from "crypto";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  notificationDeliveries,
  notificationPreferences,
  notifications,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { enqueueNotificationDelivery } from "@/lib/queue/notification.queue";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";

export type NotificationType =
  | "SHIFT_OFFER"
  | "RECONFIRM_REMINDER"
  | "CHECK_IN_ALERT"
  | "PAYMENT_RECEIVED"
  | "SYSTEM_ANNOUNCEMENT";
export type NotificationChannel = "IN_APP" | "SMS" | "PUSH";

type NotificationRow = typeof notifications.$inferSelect;

interface CursorPayload {
  createdAt: string;
  id: string;
}

function encodeCursor(row: NotificationRow): string {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id } satisfies CursorPayload)
  ).toString("base64url");
}

function decodeCursor(value?: string | null): CursorPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CursorPayload;
    const date = new Date(parsed.createdAt);
    if (!parsed.id || Number.isNaN(date.getTime())) throw new Error("invalid cursor");
    return { createdAt: date.toISOString(), id: parsed.id };
  } catch {
    throw new AppError("Cursor اعلان‌ها معتبر نیست.", "VALIDATION_ERROR", 422);
  }
}

function serialize(row: NotificationRow) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    data: row.data,
    isRead: row.isRead,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class NotificationService {
  async getPreferences(userId: string) {
    const [row] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    return {
      smsEnabled: row?.smsEnabled ?? true,
      pushEnabled: row?.pushEnabled ?? false,
      inAppAlwaysEnabled: true as const,
    };
  }

  async updatePreferences(
    userId: string,
    input: { smsEnabled: boolean; pushEnabled: boolean }
  ) {
    const now = new Date();
    const [row] = await db
      .insert(notificationPreferences)
      .values({
        id: `npr_${crypto.randomUUID()}`,
        userId,
        smsEnabled: input.smsEnabled,
        pushEnabled: input.pushEnabled,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          smsEnabled: input.smsEnabled,
          pushEnabled: input.pushEnabled,
          updatedAt: now,
        },
      })
      .returning();
    return {
      smsEnabled: row.smsEnabled,
      pushEnabled: row.pushEnabled,
      inAppAlwaysEnabled: true as const,
    };
  }

  async createNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    idempotencyKey: string;
    channels?: NotificationChannel[];
  }) {
    const safeKey = input.idempotencyKey.trim();
    if (safeKey.length < 8 || safeKey.length > 200) {
      throw new AppError("Idempotency-Key اعلان معتبر نیست.", "VALIDATION_ERROR", 422);
    }
    if (!input.title.trim() || !input.body.trim()) {
      throw new AppError("عنوان و متن اعلان الزامی است.", "VALIDATION_ERROR", 422);
    }

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`notification:${safeKey}`}))`
      );
      const [existing] = await tx
        .select()
        .from(notifications)
        .where(eq(notifications.idempotencyKey, safeKey))
        .limit(1);
      if (existing) {
        if (existing.userId !== input.userId || existing.type !== input.type) {
          throw new AppError(
            "این Idempotency-Key برای اعلان دیگری استفاده شده است.",
            "CONFLICT",
            409
          );
        }
        return { notification: existing, pendingDeliveryIds: [] as string[], idempotent: true };
      }

      const [preference] = await tx
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, input.userId))
        .limit(1);
      const smsEnabled = preference?.smsEnabled ?? true;
      const pushEnabled = preference?.pushEnabled ?? false;
      const requested = new Set<NotificationChannel>(["IN_APP", ...(input.channels ?? [])]);
      const now = new Date();
      const [notification] = await tx
        .insert(notifications)
        .values({
          id: `ntf_${crypto.randomUUID()}`,
          userId: input.userId,
          idempotencyKey: safeKey,
          title: input.title.trim(),
          body: input.body.trim(),
          type: input.type,
          data: input.data ?? {},
          isRead: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const rows: Array<typeof notificationDeliveries.$inferInsert> = [
        {
          id: `ndl_${crypto.randomUUID()}`,
          notificationId: notification.id,
          channel: "IN_APP",
          status: "SENT",
          attemptCount: 1,
          sentAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ];
      if (requested.has("SMS")) {
        rows.push({
          id: `ndl_${crypto.randomUUID()}`,
          notificationId: notification.id,
          channel: "SMS",
          status: smsEnabled ? "PENDING" : "SKIPPED",
          attemptCount: 0,
          lastError: smsEnabled ? null : "SMS_DISABLED_BY_USER",
          createdAt: now,
          updatedAt: now,
        });
      }
      if (requested.has("PUSH")) {
        rows.push({
          id: `ndl_${crypto.randomUUID()}`,
          notificationId: notification.id,
          channel: "PUSH",
          status: pushEnabled ? "PENDING" : "SKIPPED",
          attemptCount: 0,
          lastError: pushEnabled ? null : "PUSH_DISABLED_BY_USER",
          createdAt: now,
          updatedAt: now,
        });
      }
      const inserted = await tx.insert(notificationDeliveries).values(rows).returning();
      return {
        notification,
        pendingDeliveryIds: inserted
          .filter((delivery) => delivery.status === "PENDING")
          .map((delivery) => delivery.id),
        idempotent: false,
      };
    });

    if (!outcome.idempotent) {
      publishRealtimeEvent("user", input.userId, "notification.created", {
        notificationId: outcome.notification.id,
        userId: input.userId,
        type: outcome.notification.type,
      });
      for (const deliveryId of outcome.pendingDeliveryIds) {
        try {
          await enqueueNotificationDelivery(deliveryId);
        } catch (error) {
          console.error("[Notification Enqueue Error]", {
            deliveryId,
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }
    }

    return { ...serialize(outcome.notification), idempotent: outcome.idempotent };
  }

  async listForUser(
    userId: string,
    input: { limit?: number; cursor?: string | null; unreadOnly?: boolean } = {}
  ) {
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 50);
    const cursor = decodeCursor(input.cursor);
    const conditions = [eq(notifications.userId, userId)];
    if (input.unreadOnly) conditions.push(eq(notifications.isRead, false));
    if (cursor) {
      const cursorDate = new Date(cursor.createdAt);
      conditions.push(
        or(
          lt(notifications.createdAt, cursorDate),
          and(eq(notifications.createdAt, cursorDate), lt(notifications.id, cursor.id))
        )!
      );
    }
    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page.map(serialize),
      nextCursor: hasMore && page.length ? encodeCursor(page[page.length - 1]) : null,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return row?.count ?? 0;
  }

  async markRead(userId: string, notificationId: string) {
    const now = new Date();
    const [row] = await db
      .update(notifications)
      .set({ isRead: true, readAt: now, updatedAt: now })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();
    if (!row) throw new AppError("اعلان پیدا نشد.", "NOT_FOUND", 404);
    return serialize(row);
  }

  async markAllRead(userId: string) {
    const now = new Date();
    const rows = await db
      .update(notifications)
      .set({ isRead: true, readAt: now, updatedAt: now })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning({ id: notifications.id });
    return { updatedCount: rows.length };
  }
}
