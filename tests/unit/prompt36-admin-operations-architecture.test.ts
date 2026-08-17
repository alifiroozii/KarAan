import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 36 admin operations architecture guards", () => {
  it("removes hard-coded dashboard metrics and reads production overview API", () => {
    const page = source("src/app/admin/page.tsx");
    const overview = source("src/components/admin/admin-overview.tsx");
    expect(page).toContain("AdminOverview");
    expect(overview).toContain('fetch("/api/admin/overview"');
    expect(overview).not.toContain("۱,۲۴۸");
    expect(overview).not.toContain("۳,۵۶۰");
  });

  it("protects user operations with admin.users.manage", () => {
    const usersRoute = source("src/app/api/admin/users/route.ts");
    const statusRoute = source("src/app/api/admin/users/[id]/status/route.ts");
    expect(usersRoute).toContain('requirePermission(req, "admin.users.manage")');
    expect(statusRoute).toContain('requirePermission(req, "admin.users.manage")');
  });

  it("force logs out blocked users in the same transaction", () => {
    const service = source("src/modules/admin/admin-operations.service.ts");
    expect(service).toContain("db.transaction");
    expect(service).toContain("pg_advisory_xact_lock");
    expect(service).toContain("tx.delete(sessions)");
    expect(service).toContain('action: input.blocked ? "USER_BLOCKED" : "USER_UNBLOCKED"');
  });

  it("prevents self-lockout and protects privileged accounts", () => {
    const service = source("src/modules/admin/admin-operations.service.ts");
    expect(service).toContain("actorUserId === target.id");
    expect(service).toContain('actorRole !== "SUPER_ADMIN"');
    expect(service).toContain("PRIVILEGED_TARGET_ROLES");
  });

  it("redacts sensitive audit detail keys before returning them", () => {
    const service = source("src/modules/admin/admin-operations.service.ts");
    expect(service).toContain("redactSensitive");
    expect(service).toContain("[REDACTED]");
    expect(service).toContain("password|secret|token|authorization|otp|code");
  });

  it("uses cursor pagination for users and audit logs", () => {
    const service = source("src/modules/admin/admin-operations.service.ts");
    expect(service).toContain("encodeCursor");
    expect(service).toContain("decodeCursor");
    expect(service).toContain("nextCursor");
  });

  it("registers production indexes for admin filters", () => {
    const usersSchema = source("src/db/schema/users.ts");
    const systemSchema = source("src/db/schema/system.ts");
    const migration = source("drizzle/0018_admin_operations_indexes.sql");
    const journal = source("drizzle/meta/_journal.json");
    expect(usersSchema).toContain('index("idx_users_is_blocked")');
    expect(systemSchema).toContain('index("idx_audit_logs_action")');
    expect(migration).toContain('CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_name"');
    expect(journal).toContain('"0018_admin_operations_indexes"');
  });
});
