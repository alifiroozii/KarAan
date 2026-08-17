# Prompt 39 — Redis-backed Worker Presence

Prompt 39 replaces the process-local `Map` used for Worker presence with a shared Redis-backed presence store for production/horizontal deployments while preserving the existing `WorkerPresenceService` API.

## Production storage model

Each Worker has a short-lived JSON record:

- `karaan:presence:worker:{workerId}`
- record TTL: 120 seconds

Active Worker IDs are indexed in a Redis sorted set:

- `karaan:presence:online`
- score: heartbeat expiry epoch milliseconds

The 60-second online TTL remains the domain boundary. The JSON record deliberately survives for another 60 seconds so `getWorkerPresence()` can preserve the existing API behavior and return an `OFFLINE` tombstone after a missed heartbeat instead of abruptly changing to `null`.

## Atomicity

- `setWorkerAvailable()` writes the presence record and online index in one Redis MULTI.
- `touchHeartbeat()` uses Lua so an OFFLINE/missing Worker cannot be accidentally resurrected by a stale heartbeat racing with logout/offline.
- `setWorkerOffline()` uses Lua to remove the online index entry and retain a short-lived OFFLINE record.
- `getWorkerPresence()` uses Lua to expire a ghost Worker only if the heartbeat is still older than the cutoff, preventing a stale read from overwriting a newer heartbeat.

## Online listing

`listOnlineWorkers()` never uses `KEYS` or full-database `SCAN`.

1. expired sorted-set members are removed with `ZREMRANGEBYSCORE`;
2. non-expired IDs are read with a bounded `ZRANGEBYSCORE` (max 5,000 per call);
3. records are loaded with `MGET`;
4. malformed/missing/stale IDs are removed from the index;
5. only `AVAILABLE` Workers inside the heartbeat TTL are returned.

## Failure semantics

Production/development do **not** silently fall back to process memory. Redis connection/command failures are bounded by a 2.5-second presence operation timeout and surface as `503 PRESENCE_UNAVAILABLE`.

This is intentional: returning process-local presence during a Redis outage would create contradictory online/offline state across instances and could cause invalid matching offers.

`NODE_ENV=test` uses a shared in-memory adapter so unit/CI tests require no external Redis service while retaining the same public service contract.

## Redis connection lifecycle

The existing IORedis client is promoted to a `globalThis` singleton to avoid duplicate connections during Next.js module reloads/server reuse. The existing BullMQ/Geo/ETA callers continue using the same exported `redis` instance.

## Boundary of this prompt

Prompt 39 makes presence data shared across instances. It does **not** make Socket.IO event transport cross-instance. Distributed Socket.IO pub/sub is a separate realtime transport concern and should use a Redis adapter in the next prompt.
