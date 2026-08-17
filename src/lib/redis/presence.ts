import { env } from "@/config/env";
import { AppError } from "@/lib/errors";
import { ensureRedisConnected, redis } from "@/infrastructure/redis/redis-client";

export type WorkerPresenceStatus = "OFFLINE" | "AVAILABLE" | "BUSY" | "WORKING";

export interface WorkerPresenceData {
  workerId: string;
  status: WorkerPresenceStatus;
  latitude?: number;
  longitude?: number;
  maxDistanceKm: number;
  minPayRials: string;
  availableUntil?: string;
  lastHeartbeatAt: number;
}

export const PRESENCE_TTL_SECONDS = 60;
const PRESENCE_RECORD_TTL_SECONDS = PRESENCE_TTL_SECONDS * 2;
const PRESENCE_OFFLINE_TTL_SECONDS = PRESENCE_TTL_SECONDS;
const PRESENCE_OPERATION_TIMEOUT_MS = 2_500;
const PRESENCE_WORKER_PREFIX = "karaan:presence:worker:";
const PRESENCE_ONLINE_INDEX = "karaan:presence:online";
const MAX_ONLINE_WORKERS = 5_000;

export interface PresenceStore {
  setWorkerAvailable(data: Omit<WorkerPresenceData, "lastHeartbeatAt">): Promise<WorkerPresenceData>;
  touchHeartbeat(workerId: string, lat?: number, lng?: number): Promise<WorkerPresenceData | null>;
  setWorkerOffline(workerId: string): Promise<void>;
  getWorkerPresence(workerId: string): Promise<WorkerPresenceData | null>;
  listOnlineWorkers(): Promise<WorkerPresenceData[]>;
}

function offlineCopy(data: WorkerPresenceData): WorkerPresenceData {
  return { ...data, status: "OFFLINE" };
}

class MemoryPresenceStore implements PresenceStore {
  private readonly store = new Map<string, WorkerPresenceData>();

  async setWorkerAvailable(data: Omit<WorkerPresenceData, "lastHeartbeatAt">) {
    const presence: WorkerPresenceData = { ...data, lastHeartbeatAt: Date.now() };
    this.store.set(data.workerId, presence);
    return presence;
  }

  async touchHeartbeat(workerId: string, lat?: number, lng?: number) {
    const existing = this.store.get(workerId);
    if (!existing || existing.status === "OFFLINE") return null;
    const updated: WorkerPresenceData = {
      ...existing,
      latitude: lat ?? existing.latitude,
      longitude: lng ?? existing.longitude,
      lastHeartbeatAt: Date.now(),
    };
    this.store.set(workerId, updated);
    return updated;
  }

  async setWorkerOffline(workerId: string) {
    const existing = this.store.get(workerId);
    if (existing) this.store.set(workerId, offlineCopy(existing));
  }

  async getWorkerPresence(workerId: string) {
    const data = this.store.get(workerId);
    if (!data) return null;
    if (data.status !== "OFFLINE" && Date.now() - data.lastHeartbeatAt > PRESENCE_TTL_SECONDS * 1000) {
      const expired = offlineCopy(data);
      this.store.set(workerId, expired);
      return expired;
    }
    return data;
  }

  async listOnlineWorkers() {
    const now = Date.now();
    return [...this.store.values()].filter(
      (data) =>
        data.status === "AVAILABLE" &&
        now - data.lastHeartbeatAt <= PRESENCE_TTL_SECONDS * 1000
    );
  }
}

const TOUCH_HEARTBEAT_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return nil end
local data = cjson.decode(raw)
if data.status == 'OFFLINE' then return nil end
if ARGV[2] ~= '' then data.latitude = tonumber(ARGV[2]) end
if ARGV[3] ~= '' then data.longitude = tonumber(ARGV[3]) end
data.lastHeartbeatAt = tonumber(ARGV[4])
local encoded = cjson.encode(data)
redis.call('SET', KEYS[1], encoded, 'EX', tonumber(ARGV[5]))
redis.call('ZADD', KEYS[2], tonumber(ARGV[6]), ARGV[1])
return encoded
`;

const SET_OFFLINE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
redis.call('ZREM', KEYS[2], ARGV[1])
if not raw then return nil end
local data = cjson.decode(raw)
data.status = 'OFFLINE'
local encoded = cjson.encode(data)
redis.call('SET', KEYS[1], encoded, 'EX', tonumber(ARGV[2]))
return encoded
`;

const EXPIRE_GHOST_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then
  redis.call('ZREM', KEYS[2], ARGV[1])
  return nil
end
local data = cjson.decode(raw)
if data.status ~= 'OFFLINE' and tonumber(data.lastHeartbeatAt) < tonumber(ARGV[2]) then
  data.status = 'OFFLINE'
  local encoded = cjson.encode(data)
  redis.call('SET', KEYS[1], encoded, 'EX', tonumber(ARGV[3]))
  redis.call('ZREM', KEYS[2], ARGV[1])
  return encoded
end
return raw
`;

function workerKey(workerId: string) {
  return `${PRESENCE_WORKER_PREFIX}${workerId}`;
}

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Redis presence operation timed out")),
      PRESENCE_OPERATION_TIMEOUT_MS
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withRedis<T>(operation: () => Promise<T>): Promise<T> {
  try {
    await withTimeout(ensureRedisConnected());
    return await withTimeout(operation());
  } catch (error) {
    console.error("[Presence Redis Error]", {
      message: error instanceof Error ? error.message : "unknown",
    });
    throw new AppError(
      "سرویس وضعیت آنلاین موقتاً در دسترس نیست.",
      "PRESENCE_UNAVAILABLE",
      503
    );
  }
}

class RedisPresenceStore implements PresenceStore {
  async setWorkerAvailable(data: Omit<WorkerPresenceData, "lastHeartbeatAt">) {
    const now = Date.now();
    const presence: WorkerPresenceData = { ...data, lastHeartbeatAt: now };
    await withRedis(async () => {
      await redis
        .multi()
        .set(workerKey(data.workerId), JSON.stringify(presence), "EX", PRESENCE_RECORD_TTL_SECONDS)
        .zadd(PRESENCE_ONLINE_INDEX, now + PRESENCE_TTL_SECONDS * 1000, data.workerId)
        .exec();
    });
    return presence;
  }

  async touchHeartbeat(workerId: string, lat?: number, lng?: number) {
    const now = Date.now();
    const result = await withRedis(() =>
      redis.eval(
        TOUCH_HEARTBEAT_SCRIPT,
        2,
        workerKey(workerId),
        PRESENCE_ONLINE_INDEX,
        workerId,
        lat === undefined ? "" : String(lat),
        lng === undefined ? "" : String(lng),
        String(now),
        String(PRESENCE_RECORD_TTL_SECONDS),
        String(now + PRESENCE_TTL_SECONDS * 1000)
      )
    );
    if (typeof result !== "string") return null;
    return JSON.parse(result) as WorkerPresenceData;
  }

  async setWorkerOffline(workerId: string) {
    await withRedis(() =>
      redis.eval(
        SET_OFFLINE_SCRIPT,
        2,
        workerKey(workerId),
        PRESENCE_ONLINE_INDEX,
        workerId,
        String(PRESENCE_OFFLINE_TTL_SECONDS)
      )
    );
  }

  async getWorkerPresence(workerId: string) {
    const cutoff = Date.now() - PRESENCE_TTL_SECONDS * 1000;
    const result = await withRedis(() =>
      redis.eval(
        EXPIRE_GHOST_SCRIPT,
        2,
        workerKey(workerId),
        PRESENCE_ONLINE_INDEX,
        workerId,
        String(cutoff),
        String(PRESENCE_OFFLINE_TTL_SECONDS)
      )
    );
    if (typeof result !== "string") return null;
    return JSON.parse(result) as WorkerPresenceData;
  }

  async listOnlineWorkers() {
    const now = Date.now();
    return withRedis(async () => {
      await redis.zremrangebyscore(PRESENCE_ONLINE_INDEX, "-inf", now);
      const workerIds = await redis.zrangebyscore(
        PRESENCE_ONLINE_INDEX,
        `(${now}`,
        "+inf",
        "LIMIT",
        0,
        MAX_ONLINE_WORKERS
      );
      if (workerIds.length === 0) return [];

      const pipeline = redis.pipeline();
      for (const workerId of workerIds) pipeline.get(workerKey(workerId));
      const results = await pipeline.exec();
      const available: WorkerPresenceData[] = [];
      const staleIds: string[] = [];

      for (let index = 0; index < workerIds.length; index += 1) {
        const result = results?.[index];
        const raw = result && result[0] === null && typeof result[1] === "string" ? result[1] : null;
        if (!raw) {
          staleIds.push(workerIds[index]);
          continue;
        }
        try {
          const data = JSON.parse(raw) as WorkerPresenceData;
          if (
            data.status === "AVAILABLE" &&
            now - data.lastHeartbeatAt <= PRESENCE_TTL_SECONDS * 1000
          ) {
            available.push(data);
          } else if (now - data.lastHeartbeatAt > PRESENCE_TTL_SECONDS * 1000) {
            staleIds.push(workerIds[index]);
          }
        } catch {
          staleIds.push(workerIds[index]);
        }
      }

      if (staleIds.length > 0) await redis.zrem(PRESENCE_ONLINE_INDEX, ...staleIds);
      return available;
    });
  }
}

const globalState = globalThis as typeof globalThis & {
  __karaanMemoryPresenceStore?: MemoryPresenceStore;
  __karaanRedisPresenceStore?: RedisPresenceStore;
};

function defaultPresenceStore(): PresenceStore {
  if (env.NODE_ENV === "test") {
    globalState.__karaanMemoryPresenceStore ??= new MemoryPresenceStore();
    return globalState.__karaanMemoryPresenceStore;
  }
  globalState.__karaanRedisPresenceStore ??= new RedisPresenceStore();
  return globalState.__karaanRedisPresenceStore;
}

export class WorkerPresenceService {
  private readonly store: PresenceStore;

  constructor(store?: PresenceStore) {
    this.store = store ?? defaultPresenceStore();
  }

  async setWorkerAvailable(data: Omit<WorkerPresenceData, "lastHeartbeatAt">) {
    return this.store.setWorkerAvailable(data);
  }

  async touchHeartbeat(workerId: string, lat?: number, lng?: number) {
    return this.store.touchHeartbeat(workerId, lat, lng);
  }

  async setWorkerOffline(workerId: string) {
    return this.store.setWorkerOffline(workerId);
  }

  async getWorkerPresence(workerId: string) {
    return this.store.getWorkerPresence(workerId);
  }

  async listOnlineWorkers() {
    return this.store.listOnlineWorkers();
  }
}
