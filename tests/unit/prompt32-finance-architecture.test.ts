import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 32 financial architecture guards", () => {
  it("creates published shifts through the ledger-backed Escrow service, not legacy FinanceService", () => {
    const route = source("src/app/api/shifts/route.ts");
    expect(route).toContain("EscrowService");
    expect(route).toContain("createPublishedShiftWithEscrow");
    expect(route).toContain("Idempotency-Key");
    expect(route).not.toContain("FinanceService");
    expect(route).not.toContain("lockEscrow(");
  });

  it("keeps Timesheet approval separate from financial settlement", () => {
    const timesheet = source("src/modules/timesheets/timesheet-engine.service.ts");
    const settlement = source("src/modules/settlement/settlement.service.ts");
    expect(timesheet).toContain("READY_FOR_SETTLEMENT");
    expect(settlement).toContain('record.timesheet.status !== "READY_FOR_SETTLEMENT"');
    expect(settlement).toContain("creditWorkerSettlementInTransaction");
    expect(settlement).toContain("consumeEscrowInTransaction");
    expect(settlement).toContain("AssignmentStateMachine.assertCanTransition");
    expect(settlement).not.toContain("employerProfiles");
    expect(settlement).not.toContain("workerProfiles");
  });

  it("models Escrow as a transfer between AVAILABLE and LOCKED_ESCROW buckets", () => {
    const ledger = source("src/modules/wallet/wallet-ledger.service.ts");
    expect(ledger).toContain('bucket: "AVAILABLE"');
    expect(ledger).toContain('bucket: "LOCKED_ESCROW"');
    expect(ledger).toContain("reserveEscrowInTransaction");
    expect(ledger).toContain("releaseEscrowInTransaction");
    expect(ledger).toContain("reconcileProjection");
  });

  it("prepares Payout by reserving Wallet money and does not claim bank completion", () => {
    const payout = source("src/modules/payouts/payout.service.ts");
    expect(payout).toContain("reservePayoutInTransaction");
    expect(payout).toContain('status: "PENDING"');
    expect(payout).toContain("bankTransferDeferred");
    expect(payout).not.toContain('status: "DONE"');
  });
});
