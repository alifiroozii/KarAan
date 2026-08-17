import { Queue, Worker } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";
import { NoShowService } from "@/modules/no-show/no-show.service";

interface NoShowScanJobData {
  source: "SCHEDULER";
}

const QUEUE_NAME = "no-show-scan";
const SCHEDULER_ID = "no-show-scan-every-minute";

const globalState = globalThis as typeof globalThis & {
  __karaanNoShowQueue?: Queue<NoShowScanJobData>;
  __karaanNoShowWorker?: Worker<NoShowScanJobData>;
  __karaanNoShowSchedulerReady?: Promise<void>;
};

export const noShowQueue =
  globalState.__karaanNoShowQueue ??
  new Queue<NoShowScanJobData>(QUEUE_NAME, { connection: redis });
globalState.__karaanNoShowQueue = noShowQueue;

function ensureWorker(): Worker<NoShowScanJobData> {
  if (globalState.__karaanNoShowWorker) return globalState.__karaanNoShowWorker;

  const worker = new Worker<NoShowScanJobData>(
    QUEUE_NAME,
    async () => {
      const result = await new NoShowService().scanDueAssignments(new Date());
      if (result.errors.length > 0) {
        console.error("[No-show Scan Partial Failure]", result.errors);
      }
      return result;
    },
    { connection: redis, concurrency: 1 }
  );

  worker.on("failed", (job, error) => {
    console.error("[No-show Scan Job Failed]", {
      jobId: job?.id,
      message: error.message,
    });
  });

  globalState.__karaanNoShowWorker = worker;
  return worker;
}

export function ensureNoShowScheduler(): Promise<void> {
  if (globalState.__karaanNoShowSchedulerReady) {
    return globalState.__karaanNoShowSchedulerReady;
  }

  globalState.__karaanNoShowSchedulerReady = (async () => {
    ensureWorker();
    await noShowQueue.upsertJobScheduler(
      SCHEDULER_ID,
      { every: 60_000 },
      {
        name: "scan",
        data: { source: "SCHEDULER" },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }
    );
  })().catch((error) => {
    globalState.__karaanNoShowSchedulerReady = undefined;
    throw error;
  });

  return globalState.__karaanNoShowSchedulerReady;
}
