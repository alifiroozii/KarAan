export const DEFAULT_EMPLOYER_FEE_BPS = 1500;
export const DEFAULT_WORKER_COMMISSION_BPS = 0;

export function assertBasisPoints(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error(`Invalid basis points: ${value}`);
  }
  return value;
}

/**
 * Deterministic integer-money percentage calculation.
 * We round fractional Rial fees up so the escrow reserve never underfunds the
 * contractual fee by one Rial.
 */
export function calculateBpsCeil(amountRials: bigint, bps: number): bigint {
  assertBasisPoints(bps);
  if (amountRials < 0n) throw new Error("Amount cannot be negative");
  if (amountRials === 0n || bps === 0) return 0n;
  return (amountRials * BigInt(bps) + 9_999n) / 10_000n;
}

export function calculateSettlementAmounts(input: {
  workerGrossRials: bigint;
  employerFeeBps: number;
  workerCommissionBps: number;
}) {
  if (input.workerGrossRials < 0n) throw new Error("Worker gross cannot be negative");
  const employerFeeRials = calculateBpsCeil(input.workerGrossRials, input.employerFeeBps);
  const workerCommissionRials = calculateBpsCeil(
    input.workerGrossRials,
    input.workerCommissionBps
  );
  if (workerCommissionRials > input.workerGrossRials) {
    throw new Error("Worker commission exceeds gross amount");
  }
  const workerNetRials = input.workerGrossRials - workerCommissionRials;
  return {
    workerGrossRials: input.workerGrossRials,
    employerFeeRials,
    workerCommissionRials,
    workerNetRials,
    totalEscrowDebitRials: input.workerGrossRials + employerFeeRials,
  };
}
