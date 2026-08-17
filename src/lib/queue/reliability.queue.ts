import { Queue, Worker } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";
import { realtimeServer } from "@/lib/realtime/socket-server";
import { ReliabilityService } from "@/modules/reliability/reliability.service";

interface ReliabilityJobData {
  kind: "PROCESS_NO_SHOW" | "PROCESS_CANCELLATION" | "PROCESS_COMPLETION" | "SCAN";
  noShowEventId?: string;
  assignmentId?: string;
}

const QUEUE_NAME = "reliability";
const RECOVERY_SCHEDULER_ID = "reliability-source-scan-every-five-minutes";

const globalState = globalThis as typeof globalThis & {
  __karaanReliabilityQueue?: Queue<ReliabilityJobData>;
  __karaanReliabilityWorker?: Worker<ReliabilityJobData>;
  __karaanReliabilityReady?: Promise<void>;
  __karaanReliabilityRealtimeBound?: boolean;
};

export const reliabilityQueue =
  globalState.__karaanReliabilityQueue ??
  new Queue<ReliabilityJobData>(QUEUE_NAME, { connection: redis });
globalState.__karaanReliabilityQueue = reliabilityQueue;

async function addUniqueJob(name: string, data: ReliabilityJobData, jobId: string) {
  await reliabilityQueue.add(name, data, {
    jobId,
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  });
}

function bindRealtimeSources() {
  if (globalState.__karaanReliabilityRealtimeBound) return;
  globalState.__karaanReliabilityRealtimeBound = true;

  realtimeServer.subscribe((envelope) => {
    if (envelope.event === "no_show.finalized" || envelope.event === "no_show.overridden") {
      const payload = envelope.payload as { noShowEventId?: string };
      if (!payload.noShowEventId) return;
      void addUniqueJob(
        "process-no-show",
        { kind: "PROCESS_NO_SHOW", noShowEventId: payload.noShowEventId },
        `rel-no-show-${payload.noShowEventId}-${envelope.event}`
      ).catch((error) => {
        console.error("[Reliability No-show Enqueue Error]", {
          noShowEventId: payload.noShowEventId,
          message: error instanceof Error ? error.message : "unknown",
        });
      });
      return;
    }

    if (envelope.event !== "assignment.updated") return;
    const payload = envelope.payload as { assignmentId?: string; state?: string };
    if (!payload.assignmentId) return;

    if (payload.state === "CANCELLED_BY_WORKER") {
      void addUniqueJob(
        "process-cancellation",
        { kind: "PROCESS_CANCELLATION", assignmentId: payload.assignmentId },
        `rel-cancellation-${payload.assignmentId}`
      ).catch((error) => {
        console.error("[Reliability Cancellation Enqueue Error]", {
          assignmentId: payload.assignmentId,
          message: error instanceof Error ? error.message : "unknown",
        });
      });
    }

    if (payload.state === "COMPLETED") {
      void addUniqueJob(
        "process-completion",
        { kind: "PROCESS_COMPLETION", assignmentId: payload.assignmentId },
        `rel-completion-${payload.assignmentId}`
      ).catch((error) => {
        console.error("[Reliability Completion Enqueue Error]", {
          assignmentId: payload.assignmentId,
          message: error instanceof Error ? error.message : "unknown",
        });
      });
    }
  });
}

export function ensureReliabilityWorker(): Worker<ReliabilityJobData> {
  if (globalState.__karaanReliabilityWorker) return globalState.__karaanReliabilityWorker;

  const service = new ReliabilityService();
  const worker = new Worker<ReliabilityJobData>(
    QUEUE_NAME,
    async (job) => {
      switch (job.data.kind) {
        case "PROCESS_NO_SHOW":
          if (!job.data.noShowEventId) throw new Error("NO_SHOW_EVENT_ID_REQUIRED");
          return service.processNoShow(job.data.noShowEventId);
        case "PROCESS_CANCELLATION":
          if (!job.data.assignmentId) throw new Error("ASSIGNMENT_ID_REQUIRED");
          return service.processCancellationForAssignment(job.data.assignmentId);
        case "PROCESS_COMPLETION":
          if (!job.data.assignmentId) throw new Error("ASSIGNMENT_ID_REQUIRED");
          return service.processAssignmentCompleted(job.data.assignmentId);
        case "SCAN":
          return service.scanSources();
      }
    },
    { connection: redis, concurrency: 2 }
  );

  worker.on("failed", (job, error) => {
    console.error("[Reliability Job Failed]", {
      jobId: job?.id,
      kind: job?.data.kind,
      assignmentId: job?.data.assignmentId,
      noShowEventId: job?.data.noShowEventId,
      message: error.message,
    });
  });

  globalState.__karaanReliabilityWorker = worker;
  return worker;
}

export function ensureReliabilityInfrastructure(): Promise<void> {
  if (globalState.__karaanReliabilityReady) return globalState.__karaanReliabilityReady;

  globalState.__karaanReliabilityReady = (async () => {
    ensureReliabilityWorker();
    bindRealtimeSources();
    await reliabilityQueue.upsertJobScheduler(
      RECOVERY_SCHEDULER_ID,
      { every: 5 * 60_000 },
      {
        name: "source-scan",
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
    globalState.__karaanReliabilityReady = undefined;
    throw error;
  });

  return globalState.__karaanReliabilityReady;
}
