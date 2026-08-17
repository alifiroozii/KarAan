import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 33 notification architecture guards", () => {
  it("keeps durable in-app notification creation idempotent", () => {
    const service = source("src/modules/notifications/notification.service.ts");
    expect(service).toContain("pg_advisory_xact_lock");
    expect(service).toContain("idempotencyKey");
    expect(service).toContain('channel: "IN_APP"');
    expect(service).toContain('status: "SENT"');
  });

  it("routes SMS and Push through retryable delivery infrastructure", () => {
    const queue = source("src/lib/queue/notification.queue.ts");
    expect(queue).toContain("new Worker<NotificationJobData>");
    expect(queue).toContain("getSMSAdapter");
    expect(queue).toContain("getPushAdapter");
    expect(queue).toContain("attempts: 4");
    expect(queue).toContain("notification-delivery-reconcile-5m");
  });

  it("fails Push closed until a real provider is connected", () => {
    const adapter = source("src/infrastructure/push/noop-push.adapter.ts");
    const queue = source("src/lib/queue/notification.queue.ts");
    expect(adapter).toContain("unavailable: true");
    expect(queue).toContain("PUSH_PROVIDER_UNAVAILABLE");
    expect(queue).not.toContain('status: "SENT", lastError: "PUSH_PROVIDER_UNAVAILABLE"');
  });

  it("uses authenticated self-scoped notification APIs", () => {
    const route = source("src/app/api/notifications/route.ts");
    const readRoute = source("src/app/api/notifications/[id]/read/route.ts");
    expect(route).toContain("requireAuth(req)");
    expect(route).toContain("session.userId");
    expect(readRoute).toContain("session.userId");
    expect(route).not.toContain('searchParams.get("userId")');
  });

  it("migrates reconfirmation away from direct MockSMS delivery", () => {
    const reconfirmation = source("src/lib/queue/reconfirmation.queue.ts");
    expect(reconfirmation).toContain("NotificationService");
    expect(reconfirmation).toContain("RECONFIRM_REMINDER");
    expect(reconfirmation).not.toContain("MockSMSAdapter");
  });

  it("boots notification recovery infrastructure in the Node runtime", () => {
    const instrumentation = source("src/instrumentation.node.ts");
    expect(instrumentation).toContain("ensureNotificationInfrastructure");
  });
});
