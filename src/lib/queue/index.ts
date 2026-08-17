import { Queue } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";

export const shiftNotificationQueue = new Queue("shift-notifications", {
  connection: redis,
});

export {
  overtimeExpirationQueue,
  scheduleOvertimeExpiration,
} from "./overtime.queue";

export { noShowQueue, ensureNoShowScheduler } from "./no-show.queue";
export {
  backfillQueue,
  ensureBackfillWorker,
  ensureBackfillInfrastructure,
  enqueueBackfillForAssignment,
  enqueueBackfillReconcile,
} from "./backfill.queue";
export {
  reliabilityQueue,
  ensureReliabilityWorker,
  ensureReliabilityInfrastructure,
} from "./reliability.queue";
export {
  notificationDeliveryQueue,
  enqueueNotificationDelivery,
  ensureNotificationInfrastructure,
} from "./notification.queue";
