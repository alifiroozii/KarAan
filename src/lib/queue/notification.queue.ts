import { Queue, Worker } from "bullmq";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  devices,
  notificationDeliveries,
  notifications,
  users,
} from "@/db/schema";
import { redis } from "@/infrastructure/redis/redis-client";
import { getPushAdapter } from "@/infrastructure/push";
import { getSMSAdapter } from "@/infrastructure/sms";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";

interface DeliveryJobData {
  kind: "DELIVERY";
  deliveryId: string;
}
interface ReconcileJobData {
  kind: "RECONCILE";
}
type NotificationJobData = DeliveryJobData | ReconcileJobData;

const QUEUE_NAME = "notification-delivery";
const RECONCILE_SCHEDULER_ID = "notification-delivery-reconcile-5m";
const STALE_PROCESSING_MS = 10 * 60_000;

const globalState = globalThis as typeof globalThis & {
  __karaanNotificationQueue?: Queue<NotificationJobData>;
  __karaanNotificationWorker?: Worker<NotificationJobData>;
  __karaanNotificationInfrastructure?: Promise<void>;
};

export const notificationDeliveryQueue =
  globalState.__karaanNotificationQueue ??
  new Queue<NotificationJobData>(QUEUE_NAME, { connection: redis });
globalState.__karaanNotificationQueue = notificationDeliveryQueue;

async function claimDelivery(deliveryId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`notification-delivery:${deliveryId}`}))`
    );
    const [row] = await tx
      .select({
        delivery: notificationDeliveries,
        notification: notifications,
        user: users,
      })
      .from(notificationDeliveries)
      .innerJoin(notifications, eq(notifications.id, notificationDeliveries.notificationId))
      .innerJoin(users, eq(users.id, notifications.userId))
      .where(eq(notificationDeliveries.id, deliveryId))
      .limit(1);
    if (!row) return null;
    if (row.delivery.status === "SENT" || row.delivery.status === "SKIPPED") {
      return { ...row, terminal: true as const };
    }
    if (
      row.delivery.status === "PROCESSING" &&
      Date.now() - row.delivery.updatedAt.getTime() < STALE_PROCESSING_MS
    ) {
      return { ...row, terminal: true as const };
    }
    const now = new Date();
    const [claimed] = await tx
      .update(notificationDeliveries)
      .set({
        status: "PROCESSING",
        attemptCount: sql`${notificationDeliveries.attemptCount} + 1`,
        lastError: null,
        updatedAt: now,
      })
      .where(eq(notificationDeliveries.id, deliveryId))
      .returning();
    return { delivery: claimed, notification: row.notification, user: row.user, terminal: false as const };
  });
}

async function finishDelivery(
  deliveryId: string,
  status: "SENT" | "FAILED" | "SKIPPED",
  input: { lastError?: string | null; providerMessageId?: string | null } = {}
) {
  const now = new Date();
  const [delivery] = await db
    .update(notificationDeliveries)
    .set({
      status,
      lastError: input.lastError ?? null,
      providerMessageId: input.providerMessageId ?? null,
      sentAt: status === "SENT" ? now : null,
      updatedAt: now,
    })
    .where(eq(notificationDeliveries.id, deliveryId))
    .returning();
  if (delivery) {
    const [notification] = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(eq(notifications.id, delivery.notificationId))
      .limit(1);
    if (notification) {
      publishRealtimeEvent("user", notification.userId, "notification.delivery.updated", {
        notificationId: delivery.notificationId,
        deliveryId: delivery.id,
        channel: delivery.channel,
        status: delivery.status,
      });
    }
  }
}

async function processDelivery(deliveryId: string) {
  const row = await claimDelivery(deliveryId);
  if (!row || row.terminal) return { status: "SKIPPED" as const };

  if (row.delivery.channel === "IN_APP") {
    await finishDelivery(deliveryId, "SENT");
    return { status: "SENT" as const };
  }

  if (row.delivery.channel === "SMS") {
    const sent = await getSMSAdapter().sendReminder(
      row.user.phone,
      `${row.notification.title}\n${row.notification.body}`
    );
    if (!sent) {
      await finishDelivery(deliveryId, "FAILED", { lastError: "SMS_PROVIDER_REJECTED" });
      throw new Error("SMS provider rejected notification delivery");
    }
    await finishDelivery(deliveryId, "SENT");
    return { status: "SENT" as const };
  }

  const tokenRows = await db
    .select({ token: devices.pushToken })
    .from(devices)
    .where(eq(devices.userId, row.notification.userId));
  const tokens = tokenRows.flatMap((item) => (item.token ? [item.token] : []));
  if (tokens.length === 0) {
    await finishDelivery(deliveryId, "SKIPPED", { lastError: "NO_PUSH_SUBSCRIPTION" });
    return { status: "SKIPPED" as const };
  }
  const result = await getPushAdapter().send({
    userId: row.notification.userId,
    title: row.notification.title,
    body: row.notification.body,
    data: (row.notification.data ?? {}) as Record<string, unknown>,
    tokens,
  });
  if (result.unavailable) {
    await finishDelivery(deliveryId, "SKIPPED", { lastError: "PUSH_PROVIDER_UNAVAILABLE" });
    return { status: "SKIPPED" as const };
  }
  if (!result.delivered) {
    await finishDelivery(deliveryId, "FAILED", { lastError: "PUSH_PROVIDER_REJECTED" });
    throw new Error("Push provider rejected notification delivery");
  }
  await finishDelivery(deliveryId, "SENT", {
    providerMessageId: result.providerMessageId ?? null,
  });
  return { status: "SENT" as const };
}

async function reconcilePendingDeliveries() {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const rows = await db
    .select({ id: notificationDeliveries.id })
    .from(notificationDeliveries)
    .where(
      sql`(${notificationDeliveries.status} in ('PENDING','FAILED') or (${notificationDeliveries.status} = 'PROCESSING' and ${notificationDeliveries.updatedAt} < ${staleBefore}))`
    )
    .limit(100);
  let processed = 0;
  for (const row of rows) {
    try {
      await processDelivery(row.id);
      processed += 1;
    } catch (error) {
      console.error("[Notification Reconcile Delivery Error]", {
        deliveryId: row.id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return { scanned: rows.length, processed };
}

function ensureWorker(): Worker<NotificationJobData> {
  if (globalState.__karaanNotificationWorker) return globalState.__karaanNotificationWorker;
  const worker = new Worker<NotificationJobData>(
    QUEUE_NAME,
    async (job) => {
      if (job.data.kind === "RECONCILE") return reconcilePendingDeliveries();
      return processDelivery(job.data.deliveryId);
    },
    { connection: redis, concurrency: 5 }
  );
  worker.on("failed", (job, error) => {
    console.error("[Notification Delivery Job Failed]", {
      jobId: job?.id,
      message: error.message,
    });
  });
  globalState.__karaanNotificationWorker = worker;
  return worker;
}

export async function enqueueNotificationDelivery(deliveryId: string) {
  await notificationDeliveryQueue.add(
    "deliver",
    { kind: "DELIVERY", deliveryId },
    {
      attempts: 4,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: 500,
      removeOnFail: 500,
    }
  );
}

export function ensureNotificationInfrastructure(): Promise<void> {
  if (globalState.__karaanNotificationInfrastructure) {
    return globalState.__karaanNotificationInfrastructure;
  }
  globalState.__karaanNotificationInfrastructure = (async () => {
    ensureWorker();
    await notificationDeliveryQueue.upsertJobScheduler(
      RECONCILE_SCHEDULER_ID,
      { every: 5 * 60_000 },
      {
        name: "reconcile",
        data: { kind: "RECONCILE" },
        opts: {
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      }
    );
  })().catch((error) => {
    globalState.__karaanNotificationInfrastructure = undefined;
    throw error;
  });
  return globalState.__karaanNotificationInfrastructure;
}
