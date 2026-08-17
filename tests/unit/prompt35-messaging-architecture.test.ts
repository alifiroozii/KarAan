import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 35 messaging architecture guards", () => {
  it("binds one conversation to each assignment at schema and migration level", () => {
    const schema = source("src/db/schema/messaging.ts");
    const migration = source("drizzle/0017_assignment_messaging.sql");
    expect(schema).toContain('uniqueIndex("uq_conversations_assignment_id")');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "uq_conversations_assignment_id"');
    expect(migration).toContain("UPDATE messages AS m");
  });

  it("authorizes messaging through explicit view/send permissions", () => {
    const permissions = source("src/modules/auth/permissions.ts");
    expect(permissions).toContain('"message.view"');
    expect(permissions).toContain('"message.send"');
    expect(permissions).toContain('SUPPORT_AGENT: [');
  });

  it("uses assignment object access instead of client-selected participants", () => {
    const service = source("src/modules/messaging/messaging.service.ts");
    expect(service).toContain("context.workerId === actorUserId");
    expect(service).toContain("context.employerId === actorUserId");
    expect(service).toContain("branches.managerUserId");
    expect(service).toContain("businessMembers.userId");
    expect(service).not.toContain("recipientId:");
  });

  it("serializes conversation/message creation and makes retries idempotent", () => {
    const service = source("src/modules/messaging/messaging.service.ts");
    const route = source("src/app/api/conversations/[id]/messages/route.ts");
    expect(service).toContain("pg_advisory_xact_lock");
    expect(service).toContain("deterministicId(\"msg\"");
    expect(service).toContain("MAX_MESSAGES_PER_MINUTE");
    expect(route).toContain('req.headers.get("Idempotency-Key")');
  });

  it("provides cursor pagination and read receipts", () => {
    const service = source("src/modules/messaging/messaging.service.ts");
    expect(service).toContain("nextCursor");
    expect(service).toContain("readAt: now");
    expect(service).toContain('"chat.read"');
  });

  it("wires realtime messaging into query invalidation", () => {
    const events = source("src/lib/realtime/events.ts");
    const hook = source("src/hooks/use-realtime-room.ts");
    const invalidation = source("src/lib/realtime/query-invalidation.ts");
    expect(events).toContain('| "chat.message"');
    expect(events).toContain('| "chat.read"');
    expect(hook).toContain('"chat.message"');
    expect(invalidation).toContain('case "chat.message"');
    expect(invalidation).toContain('["conversations"]');
  });

  it("exposes real Worker and Employer messaging entry points", () => {
    const worker = source("src/app/worker/page.tsx");
    const employer = source("src/app/employer/shifts/[id]/page.tsx");
    const center = source("src/components/messaging/messaging-center.tsx");
    expect(worker).toContain("WorkerCurrentChatButton");
    expect(employer).toContain("EmployerAssignmentChatLauncher");
    expect(center).toContain("useInfiniteQuery");
    expect(center).toContain("خوانده شد");
  });
});
