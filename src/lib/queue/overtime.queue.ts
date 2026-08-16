import { Queue, Worker } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";
import { expireOvertimeRequest } from "@/modules/overtime/overtime-expiration";

export interface OvertimeExpirationJobData {
  overtimeRequestId: string;
}

const globalQueueState = globalThis as typeof globalThis & {
  __karaanOvertimeExpirationQueue?: Queue<OvertimeExpirationJobData>;
  __karaanOvertimeExpirationWorker?: Worker<OvertimeExpirationJobData>;
};

export const overtimeExpirationQueue =
  globalQueueState.__karaanOvertimeExpirationQueue ??
  new Queue<OvertimeExpirationJobData>("overtime-expiration", {
    connection: redis,
  });

globalQueueState.__karaanOvertimeExpirationQueue = overtimeExpirationQueue;

function ensureOvertimeExpirationWorker(): Worker<OvertimeExpirationJobData> {
  if (globalQueueState.__karaanOvertimeExpirationWorker) {
    return globalQueueState.__karaanOvertimeExpirationWorker;
  }

  const worker = new Worker<OvertimeExpirationJobData>(
    "overtime-expiration",
    async (job) => {
      await expireOvertimeRequest(job.data.overtimeRequestId);
    },
    {
      connection: redis,
      concurrency: 4,
    }
  );

  worker.on("failed", (job, error) => {
    console.error("[Overtime Expiration Job Failed]", {
      jobId: job?.id,
      overtimeRequestId: job?.data.overtimeRequestId,
      message: error.message,
    });
  });

  globalQueueState.__karaanOvertimeExpirationWorker = worker;
  return worker;
}

export async function scheduleOvertimeExpiration(
  overtimeRequestId: string,
  expiresAt: Date
): Promise<void> {
  ensureOvertimeExpirationWorker();
  const delay = Math.max(0, expiresAt.getTime() - Date.now());
  await overtimeExpirationQueue.add(
    "expire",
    { overtimeRequestId },
    {
      jobId: `overtime-expire-${overtimeRequestId}`,
      delay,
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
}
