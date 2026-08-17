import { Queue, Worker } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";
import { realtimeServer } from "@/lib/realtime/socket-server";
import {
  BackfillService,
  type BackfillTrigger,
} from "@/modules/backfill/backfill.service";
import { BackfillVacancyScanner } from "@/modules/backfill/backfill-vacancy-scanner";

interface BackfillJobData {
  kind: "REQUEST_ASSIGNMENT" | "SCAN" | "DISPATCH" | "RECONCILE";
  requestId?: string;
  sourceAssignmentId?: string;
  trigger?: Exclude<BackfillTrigger, "MANUAL">;
  shiftId?: string;
}

const QUEUE_NAME = "backfill";
const RECOVERY_SCHEDULER_ID = "backfill-vacancy-recovery-every-minute";

const globalState = globalThis as typeof globalThis & {
  __karaanBackfillQueue?: Queue<BackfillJobData>;
  __karaanBackfillWorker?: Worker<BackfillJobData>;
  __karaanBackfillInfrastructureReady?: Promise<void>;
  __karaanBackfillRealtimeBound?: boolean;
};

export const backfillQueue =
  globalState.__karaanBackfillQueue ??
  new Queue<BackfillJobData>(QUEUE_NAME, { connection: redis });
globalState.__karaanBackfillQueue = backfillQueue;

async function addDispatchJob(requestId: string, delayMs = 0, reason = "start") {
  await backfillQueue.add(
    "dispatch",
    { kind: "DISPATCH", requestId },
    {
      delay: Math.max(0, delayMs),
      jobId: `bf-${reason}-${requestId}-${delayMs > 0 ? Date.now() : "now"}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    }
  );
}

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
    await addDispatchJob(
      result.requestId,
      Math.max(1, result.retryAfterSeconds) * 1000,
      "retry"
    );
  }
}

function triggerFromAssignmentState(
  state: unknown
): Exclude<BackfillTrigger, "MANUAL"> | null {
  if (state === "NO_SHOW") return "NO_SHOW";
  if (state === "CANCELLED_BY_WORKER") return "WORKER_CANCELLATION";
  if (state === "CANCELLED_BY_EMPLOYER") return "EMPLOYER_CANCELLATION";
  return null;
}

function bindRealtimeTrigger() {
  if (globalState.__karaanBackfillRealtimeBound) return;
  globalState.__karaanBackfillRealtimeBound = true;

  realtimeServer.subscribe((envelope) => {
    if (envelope.event !== "assignment.updated") return;
    const payload = envelope.payload as {
      assignmentId?: string;
      shiftId?: string;
      state?: string;
    };
    if (!payload.assignmentId) return;
    const trigger = triggerFromAssignmentState(payload.state);
    if (!trigger) return;

    void backfillQueue
      .add(
        "request-assignment",
        {
          kind: "REQUEST_ASSIGNMENT",
          sourceAssignmentId: payload.assignmentId,
          shiftId: payload.shiftId,
          trigger,
        },
        {
          jobId: `bf-request-${payload.assignmentId}-${trigger}`,
          attempts: 3,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: 200,
          removeOnFail: 500,
        }
      )
      .catch((error) => {
        console.error("[Backfill Realtime Enqueue Error]", {
          assignmentId: payload.assignmentId,
          trigger,
          message: error instanceof Error ? error.message : "unknown",
        });
      });
  });
}

export function ensureBackfillWorker(): Worker<BackfillJobData> {
  if (globalState.__karaanBackfillWorker) return globalState.__karaanBackfillWorker;

  const service = new BackfillService();
  const scanner = new BackfillVacancyScanner();
  const worker = new Worker<BackfillJobData>(
    QUEUE_NAME,
    async (job) => {
      if (job.data.kind === "REQUEST_ASSIGNMENT") {
        if (!job.data.sourceAssignmentId || !job.data.trigger) {
          throw new Error("INVALID_BACKFILL_REQUEST_JOB");
        }
        const requested = await service.requestForAssignment({
          sourceAssignmentId: job.data.sourceAssignmentId,
          trigger: job.data.trigger,
        });
        if (requested.request?.status === "REQUESTED") {
          await addDispatchJob(requested.request.id);
        }
        return {
          assignmentId: job.data.sourceAssignmentId,
          requestId: requested.request?.id ?? null,
          created: requested.created,
        };
      }

      if (job.data.kind === "SCAN") {
        const result = await scanner.requestUnhandled(job.data.shiftId);
        for (const requestId of result.requests) {
          await addDispatchJob(requestId, 0, "recovery");
        }
        if (result.errors.length > 0) {
          console.error("[Backfill Recovery Scan Partial Failure]", result.errors);
        }
        return result;
      }

      if (!job.data.requestId) throw new Error("BACKFILL_REQUEST_ID_REQUIRED");
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
      sourceAssignmentId: job?.data.sourceAssignmentId,
      message: error.message,
    });
  });

  globalState.__karaanBackfillWorker = worker;
  return worker;
}

export function ensureBackfillInfrastructure(): Promise<void> {
  if (globalState.__karaanBackfillInfrastructureReady) {
    return globalState.__karaanBackfillInfrastructureReady;
  }

  globalState.__karaanBackfillInfrastructureReady = (async () => {
    ensureBackfillWorker();
    bindRealtimeTrigger();
    await backfillQueue.upsertJobScheduler(
      RECOVERY_SCHEDULER_ID,
      { every: 60_000 },
      {
        name: "recovery-scan",
        data: { kind: "SCAN" },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }
    );
  })().catch((error) => {
    globalState.__karaanBackfillInfrastructureReady = undefined;
    throw error;
  });

  return globalState.__karaanBackfillInfrastructureReady;
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
    await addDispatchJob(result.request.id);
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
