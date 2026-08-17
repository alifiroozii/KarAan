import { describe, expect, it } from "vitest";
import { FinanceService } from "./finance.service";

 describe("legacy FinanceService", () => {
  it("fails closed instead of mutating escrow balances outside the ledger", async () => {
    const financeService = new FinanceService();
    await expect(
      financeService.lockEscrow("emp_user_1", "shift_1", 5_000_000n, "legacy-lock")
    ).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 });
  });

  it("fails closed instead of settling assignments outside the ledger", async () => {
    const financeService = new FinanceService();
    await expect(
      financeService.settleAssignment("asg_1", "legacy-settle")
    ).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 });
  });
});
