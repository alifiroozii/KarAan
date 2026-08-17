import crypto from "crypto";
import { env } from "@/config/env";
import { ensureRedisConnected, redis } from "@/infrastructure/redis/redis-client";
import type { RealtimeEventName, RealtimeEventPayloads } from "./events";

export const REALTIME_REDIS_CHANNEL = "karaan:realtime:v1";

export interface DistributedRealtimeEnvelope<E extends RealtimeEventName = RealtimeEventName> {
  sourceInstanceId: string;
  room: string;
  event: E;
  payload: RealtimeEventPayloads[E];
  publishedAt: number;
}

const globalState = globalThis as typeof globalThis & {
  __karaanRealtimeInstanceId?: string;
};

export function getRealtimeInstanceId(): string {
  if (globalState.__karaanRealtimeInstanceId) return globalState.__karaanRealtimeInstanceId;
  globalState.__karaanRealtimeInstanceId =
    process.env.REALTIME_INSTANCE_ID?.trim() ||
    `next-${process.pid}-${crypto.randomUUID()}`;
  return globalState.__karaanRealtimeInstanceId;
}

/**
 * Redis is a best-effort realtime side channel. Domain state has already been
 * committed before this function is called, so a Redis outage must not roll
 * back the source-of-truth mutation. Production observability gets a loud log.
 */
export async function publishDistributedRealtimeEvent<E extends RealtimeEventName>(input: {
  room: string;
  event: E;
  payload: RealtimeEventPayloads[E];
  publishedAt: number;
}): Promise<number> {
  if (env.NODE_ENV === "test") return 0;

  const envelope: DistributedRealtimeEnvelope<E> = {
    sourceInstanceId: getRealtimeInstanceId(),
    ...input,
  };

  try {
    await ensureRedisConnected();
    return await redis.publish(REALTIME_REDIS_CHANNEL, JSON.stringify(envelope));
  } catch (error) {
    console.error("[Distributed Realtime Publish Error]", {
      room: input.room,
      event: input.event,
      message: error instanceof Error ? error.message : "unknown",
    });
    return 0;
  }
}
