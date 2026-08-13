import { describe, it, expect, vi } from "vitest";
import { FinanceService } from "./finance.service";

// Mock DB calls
vi.mock("@/db", () => {
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "existing_tx_123",
                idempotencyKey: "idem_key_duplicate",
                amountRials: BigInt(5000000),
              },
            ]),
          }),
        }),
      }),
    },
  };
});

describe("Financial Ledger Idempotency", () => {
  it("should return existing transaction when duplicate idempotency key is submitted", async () => {
    const financeService = new FinanceService();
    const res = await financeService.lockEscrow(
      "emp_user_1",
      "shift_1",
      BigInt(5000000),
      "idem_key_duplicate"
    );

    expect(res.transactionId).toBe("existing_tx_123");
    expect(res.lockedAmount).toBe(BigInt(5000000));
  });
});
