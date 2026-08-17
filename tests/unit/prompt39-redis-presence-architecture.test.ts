import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 39 Redis presence architecture guards", () => {
  it("removes production process-local presence fallback", () => {
    const presence = source("src/lib/redis/presence.ts");
    expect(presence).toContain('if (env.NODE_ENV === "test")');
    expect(presence).toContain("new RedisPresenceStore");
    expect(presence).toContain('"PRESENCE_UNAVAILABLE"');
    expect(presence).not.toContain("Redis is disconnected");
  });

  it("uses a TTL record plus bounded sorted-set online index", () => {
    const presence = source("src/lib/redis/presence.ts");
    expect(presence).toContain('PRESENCE_ONLINE_INDEX = "karaan:presence:online"');
    expect(presence).toContain("zremrangebyscore");
    expect(presence).toContain("zrangebyscore");
    expect(presence).toContain("MAX_ONLINE_WORKERS = 5_000");
    expect(presence).not.toContain("redis.keys(");
    expect(presence).not.toContain("redis.scan(");
  });

  it("protects heartbeat/offline ghost transitions with Lua", () => {
    const presence = source("src/lib/redis/presence.ts");
    expect(presence).toContain("TOUCH_HEARTBEAT_SCRIPT");
    expect(presence).toContain("SET_OFFLINE_SCRIPT");
    expect(presence).toContain("EXPIRE_GHOST_SCRIPT");
    expect(presence).toContain("redis.eval(");
  });

  it("keeps the existing WorkerPresenceService public operations", () => {
    const presence = source("src/lib/redis/presence.ts");
    expect(presence).toContain("async setWorkerAvailable");
    expect(presence).toContain("async touchHeartbeat");
    expect(presence).toContain("async setWorkerOffline");
    expect(presence).toContain("async getWorkerPresence");
    expect(presence).toContain("async listOnlineWorkers");
  });

  it("promotes the existing Redis client to a global singleton", () => {
    const redisClient = source("src/infrastructure/redis/redis-client.ts");
    expect(redisClient).toContain("__karaanRedis");
    expect(redisClient).toContain("globalState.__karaanRedis = redis");
    expect(redisClient).toContain("ensureRedisConnected");
  });

  it("documents that distributed Socket.IO remains a separate transport prompt", () => {
    const docs = source("docs/redis-presence.md");
    expect(docs).toContain("does **not** make Socket.IO event transport cross-instance");
  });
});
