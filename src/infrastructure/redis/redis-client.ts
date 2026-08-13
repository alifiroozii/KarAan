import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const REDIS_GEO_KEY = "karaan:workers:online_locations";
export const REDIS_WORKER_STATUS_PREFIX = "karaan:worker:status:";

export async function updateWorkerOnlineLocation(
  workerId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    if (redis.status !== "ready") await redis.connect();
    // Add to Redis geospatial index (longitude, latitude, member)
    await redis.geoadd(REDIS_GEO_KEY, longitude, latitude, workerId);
    // Set status key with TTL of 15 minutes (if ping stops, worker goes offline)
    await redis.setex(
      `${REDIS_WORKER_STATUS_PREFIX}${workerId}`,
      900,
      JSON.stringify({ latitude, longitude, updatedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("[Redis Geo Location Error]", err);
  }
}

export async function findNearbyOnlineWorkerIds(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<string[]> {
  try {
    if (redis.status !== "ready") await redis.connect();
    // GEORADIUS key longitude latitude radius km
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
    if (redis.status !== "ready") await redis.connect();
    await redis.zrem(REDIS_GEO_KEY, workerId);
    await redis.del(`${REDIS_WORKER_STATUS_PREFIX}${workerId}`);
  } catch (err) {
    console.error("[Redis Remove Geo Error]", err);
  }
}
