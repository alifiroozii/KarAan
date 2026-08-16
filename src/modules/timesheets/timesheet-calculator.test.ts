import { describe, expect, it } from "vitest";
import { calculateTimesheet } from "./timesheet-calculator";

const base = {
  scheduledStart: new Date("2026-08-16T08:00:00.000Z"),
  scheduledEnd: new Date("2026-08-16T16:00:00.000Z"),
  actualCheckIn: new Date("2026-08-16T08:00:00.000Z"),
  actualCheckOut: new Date("2026-08-16T16:00:00.000Z"),
  breakMinutes: 0,
  breakIntervals: [],
  paidBreak: false,
  hourlyRateRials: 1_200_000n,
};

function acceptedOvertime(
  rateType: "NORMAL_RATE" | "MULTIPLIER" | "FIXED_BONUS" = "NORMAL_RATE",
  options: { multiplierBps?: number; fixedBonusRials?: bigint; endHour?: number } = {}
) {
  const endHour = options.endHour ?? 17;
  return [
    {
      originalEndAt: new Date("2026-08-16T16:00:00.000Z"),
      requestedEndAt: new Date(`2026-08-16T${String(endHour).padStart(2, "0")}:00:00.000Z`),
      requestedMinutes: (endHour - 16) * 60,
      rateType,
      rateMultiplierBps: options.multiplierBps ?? 10_000,
      fixedBonusRials: options.fixedBonusRials ?? 0n,
    },
  ];
}

describe("calculateTimesheet", () => {
  it("calculates an exact hourly shift", () => {
    const result = calculateTimesheet(base);
    expect(result.grossMinutes).toBe(480);
    expect(result.regularMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.unapprovedOvertimeMinutes).toBe(0);
    expect(result.finalPayRials).toBe(9_600_000n);
    expect(result.requiresAdjustment).toBe(false);
  });

  it("deducts unpaid break but keeps paid break payable", () => {
    const breakInterval = [
      {
        startAt: new Date("2026-08-16T12:00:00.000Z"),
        endAt: new Date("2026-08-16T12:30:00.000Z"),
      },
    ];
    const unpaid = calculateTimesheet({
      ...base,
      breakMinutes: 30,
      breakIntervals: breakInterval,
      paidBreak: false,
    });
    const paid = calculateTimesheet({
      ...base,
      breakMinutes: 30,
      breakIntervals: breakInterval,
      paidBreak: true,
    });

    expect(unpaid.unpaidBreakMinutes).toBe(30);
    expect(unpaid.payableMinutes).toBe(450);
    expect(unpaid.finalPayRials).toBe(9_000_000n);
    expect(paid.paidBreakMinutes).toBe(30);
    expect(paid.payableMinutes).toBe(480);
    expect(paid.finalPayRials).toBe(9_600_000n);
  });

  it("does not pay overtime without explicit acceptance", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:00:00.000Z"),
    });

    expect(result.grossMinutes).toBe(540);
    expect(result.regularMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.unapprovedOvertimeMinutes).toBe(60);
    expect(result.overtimePayRials).toBe(0n);
    expect(result.finalPayRials).toBe(9_600_000n);
    expect(result.requiresAdjustment).toBe(true);
  });

  it("pays explicitly accepted overtime at normal rate", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:00:00.000Z"),
      acceptedOvertime: acceptedOvertime(),
    });

    expect(result.overtimeMinutes).toBe(60);
    expect(result.unapprovedOvertimeMinutes).toBe(0);
    expect(result.overtimePayRials).toBe(1_200_000n);
    expect(result.finalPayRials).toBe(10_800_000n);
    expect(result.requiresAdjustment).toBe(false);
  });

  it("pays accepted overtime at a multiplier", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:00:00.000Z"),
      acceptedOvertime: acceptedOvertime("MULTIPLIER", { multiplierBps: 15_000 }),
    });

    expect(result.overtimePayRials).toBe(1_800_000n);
    expect(result.finalPayRials).toBe(11_400_000n);
  });

  it("prorates a fixed overtime bonus when the worker leaves before accepted end", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:00:00.000Z"),
      acceptedOvertime: acceptedOvertime("FIXED_BONUS", {
        endHour: 18,
        fixedBonusRials: 2_000_000n,
      }),
    });

    expect(result.overtimeMinutes).toBe(60);
    expect(result.overtimePayRials).toBe(1_200_000n);
    expect(result.bonusRials).toBe(1_000_000n);
    expect(result.finalPayRials).toBe(11_800_000n);
  });

  it("flags only the time beyond an accepted overtime window", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:30:00.000Z"),
      acceptedOvertime: acceptedOvertime(),
    });

    expect(result.overtimeMinutes).toBe(60);
    expect(result.unapprovedOvertimeMinutes).toBe(30);
    expect(result.overtimePayRials).toBe(1_200_000n);
    expect(result.requiresAdjustment).toBe(true);
  });

  it("deducts an unpaid break that occurs during accepted overtime", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:00:00.000Z"),
      breakMinutes: 15,
      breakIntervals: [
        {
          startAt: new Date("2026-08-16T16:15:00.000Z"),
          endAt: new Date("2026-08-16T16:30:00.000Z"),
        },
      ],
      acceptedOvertime: acceptedOvertime(),
    });

    expect(result.overtimeMinutes).toBe(45);
    expect(result.unapprovedOvertimeMinutes).toBe(0);
    expect(result.overtimePayRials).toBe(900_000n);
  });

  it("supports deterministic minute rounding policies", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T15:58:00.000Z"),
      roundingIncrementMinutes: 5,
    });
    expect(result.grossMinutes).toBe(480);
    expect(result.finalPayRials).toBe(9_600_000n);
  });

  it("supports bonus and bounded deduction", () => {
    const result = calculateTimesheet({
      ...base,
      bonusRials: 500_000n,
      deductionRials: 100_000n,
    });
    expect(result.finalPayRials).toBe(10_000_000n);

    const neverNegative = calculateTimesheet({
      ...base,
      deductionRials: 100_000_000n,
    });
    expect(neverNegative.finalPayRials).toBe(0n);
  });

  it("rejects invalid attendance and overlapping overtime contracts", () => {
    expect(() =>
      calculateTimesheet({
        ...base,
        actualCheckOut: new Date("2026-08-16T07:59:00.000Z"),
      })
    ).toThrow("INVALID_ATTENDANCE_SEQUENCE");

    expect(() =>
      calculateTimesheet({
        ...base,
        actualCheckOut: new Date("2026-08-16T18:00:00.000Z"),
        acceptedOvertime: [
          ...acceptedOvertime("NORMAL_RATE", { endHour: 18 }),
          {
            originalEndAt: new Date("2026-08-16T17:00:00.000Z"),
            requestedEndAt: new Date("2026-08-16T18:00:00.000Z"),
            requestedMinutes: 60,
            rateType: "NORMAL_RATE",
            rateMultiplierBps: 10_000,
            fixedBonusRials: 0n,
          },
        ],
      })
    ).toThrow("INVALID_OVERTIME_SEQUENCE");
  });
});
