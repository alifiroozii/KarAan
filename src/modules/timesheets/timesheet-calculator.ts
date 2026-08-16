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
  roundingIncrementMinutes?: 1 | 5 | 15;
}

export interface TimesheetCalculationResult {
  grossMinutes: number;
  breakMinutes: number;
  paidBreakMinutes: number;
  unpaidBreakMinutes: number;
  payableMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  hourlyRateRials: bigint;
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

function roundMinutes(minutes: number, increment: 1 | 5 | 15): number {
  if (increment === 1) return Math.max(0, Math.floor(minutes));
  return Math.max(0, Math.round(minutes / increment) * increment);
}

export function calculateTimesheet(
  input: TimesheetCalculationInput
): TimesheetCalculationResult {
  const checkInMs = input.actualCheckIn.getTime();
  const checkOutMs = input.actualCheckOut.getTime();
  const scheduledStartMs = input.scheduledStart.getTime();
  const scheduledEndMs = input.scheduledEnd.getTime();

  if (
    !Number.isFinite(checkInMs) ||
    !Number.isFinite(checkOutMs) ||
    !Number.isFinite(scheduledStartMs) ||
    !Number.isFinite(scheduledEndMs) ||
    checkOutMs <= checkInMs ||
    scheduledEndMs <= scheduledStartMs
  ) {
    throw new Error("INVALID_ATTENDANCE_SEQUENCE");
  }

  if (input.hourlyRateRials < 0n) throw new Error("INVALID_HOURLY_RATE");

  const roundingIncrement = input.roundingIncrementMinutes ?? 1;
  const rawGrossMinutes = Math.max(0, (checkOutMs - checkInMs) / 60_000);
  const grossMinutes = roundMinutes(rawGrossMinutes, roundingIncrement);
  const breakMinutes = Math.min(
    grossMinutes,
    Math.max(0, Math.floor(input.breakMinutes))
  );
  const paidBreakMinutes = input.paidBreak ? breakMinutes : 0;
  const unpaidBreakMinutes = input.paidBreak ? 0 : breakMinutes;
  const payableMinutes = Math.max(0, grossMinutes - unpaidBreakMinutes);

  const rawOvertimeMinutes = Math.max(
    0,
    Math.floor((checkOutMs - scheduledEndMs) / 60_000)
  );
  const overtimeMinutes = Math.min(payableMinutes, rawOvertimeMinutes);
  const regularMinutes = Math.max(0, payableMinutes - overtimeMinutes);

  // Prompt 23 attaches explicit accepted overtime terms. Until then overtime is
  // surfaced for review but never silently paid as regular time.
  const calculatedPayRials = roundRationalRials(
    input.hourlyRateRials * BigInt(regularMinutes),
    60n
  );

  const bonusRials = input.bonusRials ?? 0n;
  const deductionRials = input.deductionRials ?? 0n;
  if (bonusRials < 0n || deductionRials < 0n) {
    throw new Error("INVALID_TIMESHEET_ADJUSTMENT");
  }

  const finalPayRials = calculatedPayRials + bonusRials - deductionRials;

  return {
    grossMinutes,
    breakMinutes,
    paidBreakMinutes,
    unpaidBreakMinutes,
    payableMinutes,
    regularMinutes,
    overtimeMinutes,
    hourlyRateRials: input.hourlyRateRials,
    calculatedPayRials,
    bonusRials,
    deductionRials,
    finalPayRials: finalPayRials < 0n ? 0n : finalPayRials,
    requiresAdjustment: overtimeMinutes > 0,
  };
}
