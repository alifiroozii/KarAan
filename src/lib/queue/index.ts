import { Queue } from "bullmq";
import { redis } from "@/infrastructure/redis/redis-client";

export const shiftNotificationQueue = new Queue("shift-notifications", {
  connection: redis,
});
