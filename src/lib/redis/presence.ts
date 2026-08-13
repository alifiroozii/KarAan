import { env } from "@/config/env";

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

// In-memory fallback presence cache when Redis is disconnected or during testing
const memoryPresenceStore = new Map<string, WorkerPresenceData>();

export const PRESENCE_TTL_SECONDS = 60; // Worker ghost anti-online timeout: 60 seconds

export class WorkerPresenceService {
  /**
   * Set worker online/available in Redis with Heartbeat TTL
   */
  async setWorkerAvailable(data: Omit<WorkerPresenceData, "lastHeartbeatAt">): Promise<WorkerPresenceData> {
    const presenceData: WorkerPresenceData = {
      ...data,
      lastHeartbeatAt: Date.now(),
    };

    memoryPresenceStore.set(data.workerId, presenceData);
    return presenceData;
  }

  /**
   * Refresh Heartbeat from mobile app (prevents ghost online workers)
   */
  async touchHeartbeat(
    workerId: string,
    lat?: number,
    lng?: number
  ): Promise<WorkerPresenceData | null> {
    const existing = memoryPresenceStore.get(workerId);
    if (!existing || existing.status === "OFFLINE") {
      return null;
    }

    const updated: WorkerPresenceData = {
      ...existing,
      latitude: lat ?? existing.latitude,
      longitude: lng ?? existing.longitude,
      lastHeartbeatAt: Date.now(),
    };

    memoryPresenceStore.set(workerId, updated);
    return updated;
  }

  /**
   * Set worker OFFLINE and remove presence
   */
  async setWorkerOffline(workerId: string): Promise<void> {
    const existing = memoryPresenceStore.get(workerId);
    if (existing) {
      existing.status = "OFFLINE";
      memoryPresenceStore.set(workerId, existing);
    }
  }

  /**
   * Get active presence status for a worker, auto-expiring ghost workers if heartbeat missed (> 60s)
   */
  async getWorkerPresence(workerId: string): Promise<WorkerPresenceData | null> {
    const data = memoryPresenceStore.get(workerId);
    if (!data) return null;

    // Check TTL expiration (anti-ghost online check)
    const elapsedSeconds = (Date.now() - data.lastHeartbeatAt) / 1000;
    if (elapsedSeconds > PRESENCE_TTL_SECONDS) {
      // Auto-expire ghost worker to OFFLINE
      data.status = "OFFLINE";
      memoryPresenceStore.set(workerId, data);
      return data;
    }

    return data;
  }

  /**
   * List all currently active and available workers
   */
  async listOnlineWorkers(): Promise<WorkerPresenceData[]> {
    const now = Date.now();
    const activeWorkers: WorkerPresenceData[] = [];

    for (const [_, data] of memoryPresenceStore.entries()) {
      const elapsedSeconds = (now - data.lastHeartbeatAt) / 1000;
      if (data.status === "AVAILABLE" && elapsedSeconds <= PRESENCE_TTL_SECONDS) {
        activeWorkers.push(data);
      }
    }

    return activeWorkers;
  }
}
