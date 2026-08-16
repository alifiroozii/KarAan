export interface TimesheetCalculationInput {
  scheduledStart: Date;
  scheduledEnd: Date;
  actualCheckIn: Date;
  actualCheckOut: Date;
  breakMinutes: number;
  paidBreak: boolean;
  hourlyRateRials: bigint;
  bonusRials?: bigint;
  deductionRials?: bigint;
}

export interface TimesheetCalculationResult {
  grossMinutes: number;
  breakMinutes: number;
  payableMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  calculatedPayRials: bigint;
  bonusRials: bigint;
  deductionRials: bigint;
  finalPayRials: bigint;
  requiresAdjustment: boolean;
}

function roundRationalRials(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("INVALID_MONEY_DENOMINATOR");
  if (numerator <= 0n) return 0n;
  return (numerator + denominator / 2n) / denominator;
}

export function calculateTimesheet(
  input: TimesheetCalculationInput
): TimesheetCalculationResult {
  const checkInMs = input.actualCheckIn.getTime();
  const checkOutMs = input.actualCheckOut.getTime();
  if (!Number.isFinite(checkInMs) || !Number.isFinite(checkOutMs) || checkOutMs <= checkInMs) {
    throw new Error("INVALID_ATTENDANCE_SEQUENCE");
  }

  const grossMinutes = Math.max(0, Math.floor((checkOutMs - checkInMs) / 60_000));
  const breakMinutes = Math.max(0, Math.floor(input.breakMinutes));
  const unpaidBreakMinutes = input.paidBreak ? 0 : Math.min(grossMinutes, breakMinutes);
  const payableMinutes = Math.max(0, grossMinutes - unpaidBreakMinutes);

  const scheduledEndMs = input.scheduledEnd.getTime();
  const rawOvertimeMinutes = Math.max(0, Math.floor((checkOutMs - scheduledEndMs) / 60_000));
  const overtimeMinutes = Math.min(payableMinutes, rawOvertimeMinutes);
  const regularMinutes = Math.max(0, payableMinutes - overtimeMinutes);

  // Prompt 23 will attach approved overtime terms. Until then, overtime is visible
  // but deliberately not paid automatically to avoid paying time that was never approved.
  const calculatedPayRials = roundRationalRials(
    input.hourlyRateRials * BigInt(regularMinutes),
    60n
  );

  const bonusRials = input.bonusRials ?? 0n;
  const deductionRials = input.deductionRials ?? 0n;
  const finalPayRials = calculatedPayRials + bonusRials - deductionRials;

  return {
    grossMinutes,
    breakMinutes,
    payableMinutes,
    regularMinutes,
    overtimeMinutes,
    calculatedPayRials,
    bonusRials,
    deductionRials,
    finalPayRials: finalPayRials < 0n ? 0n : finalPayRials,
    requiresAdjustment: overtimeMinutes > 0,
  };
}
