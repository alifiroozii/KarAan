import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMPLOYER_FEE_BPS,
  DEFAULT_WORKER_COMMISSION_BPS,
  calculateBpsCeil,
  calculateSettlementAmounts,
} from "@/modules/settlement/settlement-policy";

describe("Prompt 32 settlement money policy", () => {
  it("uses 15 percent employer fee and zero worker commission by default", () => {
    expect(DEFAULT_EMPLOYER_FEE_BPS).toBe(1500);
    expect(DEFAULT_WORKER_COMMISSION_BPS).toBe(0);

    const result = calculateSettlementAmounts({
      workerGrossRials: 10_000_000n,
      employerFeeBps: DEFAULT_EMPLOYER_FEE_BPS,
      workerCommissionBps: DEFAULT_WORKER_COMMISSION_BPS,
    });

    expect(result).toEqual({
      workerGrossRials: 10_000_000n,
      employerFeeRials: 1_500_000n,
      workerCommissionRials: 0n,
      workerNetRials: 10_000_000n,
      totalEscrowDebitRials: 11_500_000n,
    });
  });

  it("rounds fractional-Rial fees upward deterministically", () => {
    expect(calculateBpsCeil(1n, 1500)).toBe(1n);
    expect(calculateBpsCeil(10_001n, 1500)).toBe(1_501n);
    expect(calculateBpsCeil(5_000_000n, 0)).toBe(0n);
  });

  it("deducts configured worker commission from worker net without increasing employer escrow cost", () => {
    const result = calculateSettlementAmounts({
      workerGrossRials: 10_000_000n,
      employerFeeBps: 1500,
      workerCommissionBps: 500,
    });

    expect(result.workerCommissionRials).toBe(500_000n);
    expect(result.workerNetRials).toBe(9_500_000n);
    expect(result.employerFeeRials).toBe(1_500_000n);
    expect(result.totalEscrowDebitRials).toBe(11_500_000n);
  });

  it("rejects invalid basis points and negative money", () => {
    expect(() => calculateBpsCeil(1_000n, -1)).toThrow();
    expect(() => calculateBpsCeil(1_000n, 10_001)).toThrow();
    expect(() => calculateBpsCeil(-1n, 1500)).toThrow();
  });
});
