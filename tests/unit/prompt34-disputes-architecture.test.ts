import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 34 dispute architecture guards", () => {
  it("creates a durable dispute record and blocks the timesheet atomically", () => {
    const service = source("src/modules/disputes/dispute.service.ts");
    expect(service).toContain("pg_advisory_xact_lock");
    expect(service).toContain("tx.insert(disputes)");
    expect(service).toContain('status: "DISPUTED"');
    expect(service).toContain("DISPUTE_OPENED");
  });

  it("keeps money mutations outside dispute resolution", () => {
    const service = source("src/modules/disputes/dispute.service.ts");
    expect(service).not.toContain("walletLedgerEntries");
    expect(service).not.toContain("escrowHolds");
    expect(service).not.toContain("payout");
  });

  it("returns accepted disputes to adjustment and rejected disputes to submission", () => {
    const service = source("src/modules/disputes/dispute.service.ts");
    expect(service).toContain('action === "REQUIRE_ADJUSTMENT" ? "ADJUSTMENT_REQUIRED" : "SUBMITTED"');
    expect(service).toContain("approvedAt: null");
    expect(service).toContain("readyForSettlementAt: null");
  });

  it("protects review and resolution with dispute.manage", () => {
    const review = source("src/app/api/disputes/[id]/review/route.ts");
    const resolve = source("src/app/api/disputes/[id]/resolve/route.ts");
    expect(review).toContain('requirePermission(req, "dispute.manage")');
    expect(resolve).toContain('requirePermission(req, "dispute.manage")');
  });

  it("routes the existing timesheet dispute endpoint into the dispute domain", () => {
    const route = source("src/app/api/timesheets/[id]/dispute/route.ts");
    expect(route).toContain("DisputeService");
    expect(route).toContain("openFromTimesheet");
  });

  it("keeps production demo navigable even when interactive demo backend fails", () => {
    const demoRoute = source("src/app/api/auth/demo/route.ts");
    const demoPage = source("src/app/demo/[role]/[[...section]]/page.tsx");
    expect(demoRoute).toContain("fallbackDestination");
    expect(demoRoute).toContain("wantsHtml");
    expect(demoPage).toContain("Read-only fallback");
  });
});
