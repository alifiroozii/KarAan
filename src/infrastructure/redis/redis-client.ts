import Redis from "ioredis";
import { env } from "@/config/env";

const globalState = globalThis as typeof globalThis & {
  __karaanRedis?: Redis;
  __karaanRedisErrorListenerInstalled?: boolean;
};

export const redis =
  globalState.__karaanRedis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 5_000,
  });

globalState.__karaanRedis = redis;

if (!globalState.__karaanRedisErrorListenerInstalled) {
  redis.on("error", (error) => {
    console.error("[Redis Connection Error]", error.message);
  });
  globalState.__karaanRedisErrorListenerInstalled = true;
}

export const REDIS_GEO_KEY = "karaan:workers:online_locations";
export const REDIS_WORKER_STATUS_PREFIX = "karaan:worker:status:";
export const REDIS_ASSIGNMENT_ETA_PREFIX = "karaan:assignment:eta:";

export async function ensureRedisConnected(): Promise<void> {
  if (redis.status === "ready") return;
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
  if (redis.status !== "ready") {
    await redis.ping();
  }
}

export async function updateWorkerOnlineLocation(
  workerId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    await ensureRedisConnected();
    await redis.geoadd(REDIS_GEO_KEY, longitude, latitude, workerId);
    await redis.setex(
      `${REDIS_WORKER_STATUS_PREFIX}${workerId}`,
      900,
      JSON.stringify({ latitude, longitude, updatedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("[Redis Geo Location Error]", err);
  }
}

export async function getWorkerOnlineLocation(
  workerId: string
): Promise<{ latitude: number; longitude: number; updatedAt: string } | null> {
  try {
    await ensureRedisConnected();
    const raw = await redis.get(`${REDIS_WORKER_STATUS_PREFIX}${workerId}`);
    if (!raw) return null;
    return JSON.parse(raw) as { latitude: number; longitude: number; updatedAt: string };
  } catch (err) {
    console.error("[Redis Get Worker Location Error]", err);
    return null;
  }
}

export async function setAssignmentEta(
  assignmentId: string,
  eta: {
    distanceMeters: number;
    durationSeconds: number;
    estimatedArrivalAt: string;
    calculatedAt: string;
    lateRisk: "ON_TIME" | "RISK_OF_LATE" | "LATE";
  },
  ttlSeconds = 120
): Promise<void> {
  try {
    await ensureRedisConnected();
    await redis.setex(
      `${REDIS_ASSIGNMENT_ETA_PREFIX}${assignmentId}`,
      ttlSeconds,
      JSON.stringify(eta)
    );
  } catch (err) {
    console.error("[Redis Assignment ETA Error]", err);
  }
}

export async function getAssignmentEta(assignmentId: string) {
  try {
    await ensureRedisConnected();
    const raw = await redis.get(`${REDIS_ASSIGNMENT_ETA_PREFIX}${assignmentId}`);
    if (!raw) return null;
    return JSON.parse(raw) as {
      distanceMeters: number;
      durationSeconds: number;
      estimatedArrivalAt: string;
      calculatedAt: string;
      lateRisk: "ON_TIME" | "RISK_OF_LATE" | "LATE";
    };
  } catch (err) {
    console.error("[Redis Get Assignment ETA Error]", err);
    return null;
  }
}

export async function findNearbyOnlineWorkerIds(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<string[]> {
  try {
    await ensureRedisConnected();
    const results = await redis.georadius(
      REDIS_GEO_KEY,
      longitude,
      latitude,
      radiusKm,
      "km"
    );
    return results as string[];
  } catch (err) {
    console.error("[Redis GeoRadius Error]", err);
    return [];
  }
}

export async function removeWorkerOnlineLocation(workerId: string): Promise<void> {
  try {
    await ensureRedisConnected();
    await redis.zrem(REDIS_GEO_KEY, workerId);
    await redis.del(`${REDIS_WORKER_STATUS_PREFIX}${workerId}`);
  } catch (err) {
    console.error("[Redis Remove Geo Error]", err);
  }
}
