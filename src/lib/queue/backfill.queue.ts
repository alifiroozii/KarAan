import { Queue, Worker } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";
import {
  BackfillService,
  type BackfillTrigger,
} from "@/modules/backfill/backfill.service";

interface BackfillJobData {
  kind: "DISPATCH" | "RECONCILE";
  requestId: string;
}

const QUEUE_NAME = "backfill";

const globalState = globalThis as typeof globalThis & {
  __karaanBackfillQueue?: Queue<BackfillJobData>;
  __karaanBackfillWorker?: Worker<BackfillJobData>;
};

export const backfillQueue =
  globalState.__karaanBackfillQueue ??
  new Queue<BackfillJobData>(QUEUE_NAME, { connection: redis });
globalState.__karaanBackfillQueue = backfillQueue;

async function scheduleFromResult(result: {
  requestId: string;
  status: string;
  expiresAt: Date | null;
  shouldRetry: boolean;
  retryAfterSeconds: number;
}) {
  if (result.status === "OFFERED" && result.expiresAt) {
    const delay = Math.max(1_000, result.expiresAt.getTime() - Date.now() + 1_000);
    await backfillQueue.add(
      "reconcile",
      { kind: "RECONCILE", requestId: result.requestId },
      {
        delay,
        jobId: `bf-reconcile-${result.requestId}-${result.expiresAt.getTime()}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      }
    );
    return;
  }

  if (result.shouldRetry) {
    await backfillQueue.add(
      "dispatch",
      { kind: "DISPATCH", requestId: result.requestId },
      {
        delay: Math.max(1, result.retryAfterSeconds) * 1000,
        jobId: `bf-retry-${result.requestId}-${Date.now()}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      }
    );
  }
}

export function ensureBackfillWorker(): Worker<BackfillJobData> {
  if (globalState.__karaanBackfillWorker) return globalState.__karaanBackfillWorker;

  const service = new BackfillService();
  const worker = new Worker<BackfillJobData>(
    QUEUE_NAME,
    async (job) => {
      const result =
        job.data.kind === "DISPATCH"
          ? await service.dispatch(job.data.requestId)
          : await service.reconcile(job.data.requestId, new Date());
      await scheduleFromResult(result);
      return {
        requestId: result.requestId,
        status: result.status,
        offersCreatedNow: result.offersCreatedNow,
      };
    },
    { connection: redis, concurrency: 2 }
  );

  worker.on("failed", (job, error) => {
    console.error("[Backfill Job Failed]", {
      jobId: job?.id,
      kind: job?.data.kind,
      requestId: job?.data.requestId,
      message: error.message,
    });
  });

  globalState.__karaanBackfillWorker = worker;
  return worker;
}

export async function enqueueBackfillForAssignment(input: {
  sourceAssignmentId: string;
  trigger: Exclude<BackfillTrigger, "MANUAL">;
  actorId?: string | null;
}) {
  const service = new BackfillService();
  const result = await service.requestForAssignment(input);
  if (!result.request) return result;

  if (result.request.status === "REQUESTED") {
    await backfillQueue.add(
      "dispatch",
      { kind: "DISPATCH", requestId: result.request.id },
      {
        jobId: `bf-start-${result.request.id}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      }
    );
  }
  return result;
}

export async function enqueueBackfillReconcile(requestId: string, delayMs = 0) {
  await backfillQueue.add(
    "reconcile",
    { kind: "RECONCILE", requestId },
    {
      delay: Math.max(0, delayMs),
      jobId: `bf-manual-reconcile-${requestId}-${Date.now()}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    }
  );
}
