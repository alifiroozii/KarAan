export interface TimesheetBreakInterval {
  startAt: Date;
  endAt: Date;
}

export interface AcceptedOvertimeSegment {
  originalEndAt: Date;
  requestedEndAt: Date;
  requestedMinutes: number;
  rateType: "NORMAL_RATE" | "MULTIPLIER" | "FIXED_BONUS";
  rateMultiplierBps: number;
  fixedBonusRials: bigint;
}

export interface TimesheetCalculationInput {
  scheduledStart: Date;
  scheduledEnd: Date;
  actualCheckIn: Date;
  actualCheckOut: Date;
  breakMinutes: number;
  breakIntervals?: TimesheetBreakInterval[];
  paidBreak: boolean;
  hourlyRateRials: bigint;
  acceptedOvertime?: AcceptedOvertimeSegment[];
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
  unapprovedOvertimeMinutes: number;
  hourlyRateRials: bigint;
  overtimePayRials: bigint;
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

function overlapMinutes(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): number {
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  if (end <= start) return 0;
  return Math.floor((end - start) / 60_000);
}

function breakOverlapMinutes(
  breaks: TimesheetBreakInterval[],
  start: Date,
  end: Date
): number {
  return breaks.reduce(
    (total, item) => total + overlapMinutes(item.startAt, item.endAt, start, end),
    0
  );
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

  const breakIntervals = input.breakIntervals ?? [];
  for (const item of breakIntervals) {
    if (item.endAt <= item.startAt) throw new Error("INVALID_BREAK_SEQUENCE");
  }

  const accepted = [...(input.acceptedOvertime ?? [])].sort(
    (a, b) => a.originalEndAt.getTime() - b.originalEndAt.getTime()
  );
  for (let index = 0; index < accepted.length; index += 1) {
    const item = accepted[index];
    if (
      item.requestedEndAt <= item.originalEndAt ||
      item.requestedMinutes <= 0 ||
      item.rateMultiplierBps < 10_000 ||
      item.rateMultiplierBps > 30_000 ||
      item.fixedBonusRials < 0n
    ) {
      throw new Error("INVALID_OVERTIME_SEQUENCE");
    }
    if (index > 0 && item.originalEndAt < accepted[index - 1].requestedEndAt) {
      throw new Error("INVALID_OVERTIME_SEQUENCE");
    }
  }

  const roundingIncrement = input.roundingIncrementMinutes ?? 1;
  const rawGrossMinutes = Math.max(0, (checkOutMs - checkInMs) / 60_000);
  const grossMinutes = roundMinutes(rawGrossMinutes, roundingIncrement);

  const derivedBreakMinutes =
    breakIntervals.length > 0
      ? breakOverlapMinutes(breakIntervals, input.actualCheckIn, input.actualCheckOut)
      : Math.max(0, Math.floor(input.breakMinutes));
  const breakMinutes = Math.min(grossMinutes, derivedBreakMinutes);
  const paidBreakMinutes = input.paidBreak ? breakMinutes : 0;
  const unpaidBreakMinutes = input.paidBreak ? 0 : breakMinutes;
  const payableMinutes = Math.max(0, grossMinutes - unpaidBreakMinutes);

  const regularEnd = new Date(Math.min(checkOutMs, scheduledEndMs));
  const rawRegularMinutes = Math.max(
    0,
    (regularEnd.getTime() - checkInMs) / 60_000
  );
  const roundedRegularMinutes = Math.min(
    grossMinutes,
    roundMinutes(rawRegularMinutes, roundingIncrement)
  );
  const regularBreakMinutes = input.paidBreak
    ? 0
    : breakIntervals.length > 0
      ? breakOverlapMinutes(breakIntervals, input.actualCheckIn, regularEnd)
      : Math.min(unpaidBreakMinutes, roundedRegularMinutes);
  const regularMinutes = Math.max(0, roundedRegularMinutes - regularBreakMinutes);

  let overtimeMinutes = 0;
  let overtimePayRials = 0n;
  let overtimeBonusRials = 0n;

  for (const segment of accepted) {
    const workedStart = new Date(Math.max(checkInMs, segment.originalEndAt.getTime()));
    const workedEnd = new Date(Math.min(checkOutMs, segment.requestedEndAt.getTime()));
    if (workedEnd <= workedStart) continue;

    const rawSegmentMinutes = overlapMinutes(
      workedStart,
      workedEnd,
      workedStart,
      workedEnd
    );
    const unpaidSegmentBreakMinutes = input.paidBreak
      ? 0
      : breakOverlapMinutes(breakIntervals, workedStart, workedEnd);
    const workedMinutes = Math.max(0, rawSegmentMinutes - unpaidSegmentBreakMinutes);
    if (workedMinutes <= 0) continue;

    overtimeMinutes += workedMinutes;

    if (segment.rateType === "MULTIPLIER") {
      overtimePayRials += roundRationalRials(
        input.hourlyRateRials * BigInt(segment.rateMultiplierBps) * BigInt(workedMinutes),
        60n * 10_000n
      );
    } else {
      overtimePayRials += roundRationalRials(
        input.hourlyRateRials * BigInt(workedMinutes),
        60n
      );
    }

    if (segment.rateType === "FIXED_BONUS" && segment.fixedBonusRials > 0n) {
      const cappedWorkedMinutes = Math.min(workedMinutes, segment.requestedMinutes);
      overtimeBonusRials += roundRationalRials(
        segment.fixedBonusRials * BigInt(cappedWorkedMinutes),
        BigInt(segment.requestedMinutes)
      );
    }
  }

  const postScheduleStart = new Date(Math.max(checkInMs, scheduledEndMs));
  const rawPostScheduleMinutes = Math.max(
    0,
    Math.floor((checkOutMs - postScheduleStart.getTime()) / 60_000)
  );
  const postScheduleBreakMinutes = input.paidBreak
    ? 0
    : breakIntervals.length > 0
      ? breakOverlapMinutes(breakIntervals, postScheduleStart, input.actualCheckOut)
      : Math.max(0, unpaidBreakMinutes - regularBreakMinutes);
  const payablePostScheduleMinutes = Math.max(
    0,
    rawPostScheduleMinutes - postScheduleBreakMinutes
  );
  const unapprovedOvertimeMinutes = Math.max(
    0,
    payablePostScheduleMinutes - overtimeMinutes
  );

  const regularPayRials = roundRationalRials(
    input.hourlyRateRials * BigInt(regularMinutes),
    60n
  );
  const calculatedPayRials = regularPayRials + overtimePayRials;

  const manualBonusRials = input.bonusRials ?? 0n;
  const deductionRials = input.deductionRials ?? 0n;
  if (manualBonusRials < 0n || deductionRials < 0n) {
    throw new Error("INVALID_TIMESHEET_ADJUSTMENT");
  }
  const bonusRials = manualBonusRials + overtimeBonusRials;
  const finalPayRials = calculatedPayRials + bonusRials - deductionRials;

  return {
    grossMinutes,
    breakMinutes,
    paidBreakMinutes,
    unpaidBreakMinutes,
    payableMinutes,
    regularMinutes,
    overtimeMinutes,
    unapprovedOvertimeMinutes,
    hourlyRateRials: input.hourlyRateRials,
    overtimePayRials,
    calculatedPayRials,
    bonusRials,
    deductionRials,
    finalPayRials: finalPayRials < 0n ? 0n : finalPayRials,
    requiresAdjustment: unapprovedOvertimeMinutes > 0,
  };
}
