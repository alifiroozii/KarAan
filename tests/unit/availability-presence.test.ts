import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkerPresenceService, PRESENCE_TTL_SECONDS } from "@/lib/redis/presence";

describe("Worker Availability & Real-Time Presence Unit Tests", () => {
  let presenceService: WorkerPresenceService;

  beforeEach(() => {
    presenceService = new WorkerPresenceService();
    vi.useRealTimers();
  });

  it("should set worker AVAILABLE and retrieve presence data", async () => {
    const presence = await presenceService.setWorkerAvailable({
      workerId: "usr_worker_101",
      status: "AVAILABLE",
      maxDistanceKm: 15,
      minPayRials: "1500000",
      latitude: 35.7000,
      longitude: 51.3500,
    });

    expect(presence.workerId).toBe("usr_worker_101");
    expect(presence.status).toBe("AVAILABLE");
    expect(presence.lastHeartbeatAt).toBeGreaterThan(0);

    const fetched = await presenceService.getWorkerPresence("usr_worker_101");
    expect(fetched?.status).toBe("AVAILABLE");
  });

  it("should touch heartbeat and update timestamp", async () => {
    await presenceService.setWorkerAvailable({
      workerId: "usr_worker_102",
      status: "AVAILABLE",
      maxDistanceKm: 20,
      minPayRials: "2000000",
    });

    const touched = await presenceService.touchHeartbeat("usr_worker_102", 35.7500, 51.4000);
    expect(touched?.latitude).toBe(35.7500);
    expect(touched?.longitude).toBe(51.4000);
  });

  it("should auto-expire ghost online worker if heartbeat is missed beyond TTL (> 60s)", async () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    await presenceService.setWorkerAvailable({
      workerId: "usr_worker_ghost",
      status: "AVAILABLE",
      maxDistanceKm: 10,
      minPayRials: "1000000",
    });

    // Advance time by 65 seconds (beyond 60s TTL)
    vi.setSystemTime(now + (PRESENCE_TTL_SECONDS + 5) * 1000);

    const presence = await presenceService.getWorkerPresence("usr_worker_ghost");
    expect(presence?.status).toBe("OFFLINE");

    const onlineList = await presenceService.listOnlineWorkers();
    expect(onlineList.some((w) => w.workerId === "usr_worker_ghost")).toBe(false);
  });

  it("should set worker OFFLINE explicitly", async () => {
    await presenceService.setWorkerAvailable({
      workerId: "usr_worker_103",
      status: "AVAILABLE",
      maxDistanceKm: 15,
      minPayRials: "1500000",
    });

    await presenceService.setWorkerOffline("usr_worker_103");
    const presence = await presenceService.getWorkerPresence("usr_worker_103");
    expect(presence?.status).toBe("OFFLINE");
  });
});
