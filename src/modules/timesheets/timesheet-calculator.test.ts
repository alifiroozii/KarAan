import { describe, expect, it } from "vitest";
import { calculateTimesheet } from "./timesheet-calculator";

const base = {
  scheduledStart: new Date("2026-08-16T08:00:00.000Z"),
  scheduledEnd: new Date("2026-08-16T16:00:00.000Z"),
  actualCheckIn: new Date("2026-08-16T08:00:00.000Z"),
  actualCheckOut: new Date("2026-08-16T16:00:00.000Z"),
  breakMinutes: 0,
  paidBreak: false,
  hourlyRateRials: 1_200_000n,
};

describe("calculateTimesheet", () => {
  it("calculates an exact hourly shift", () => {
    const result = calculateTimesheet(base);
    expect(result.grossMinutes).toBe(480);
    expect(result.regularMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.finalPayRials).toBe(9_600_000n);
    expect(result.requiresAdjustment).toBe(false);
  });

  it("deducts unpaid break but keeps paid break payable", () => {
    const unpaid = calculateTimesheet({ ...base, breakMinutes: 30, paidBreak: false });
    const paid = calculateTimesheet({ ...base, breakMinutes: 30, paidBreak: true });

    expect(unpaid.unpaidBreakMinutes).toBe(30);
    expect(unpaid.paidBreakMinutes).toBe(0);
    expect(unpaid.payableMinutes).toBe(450);
    expect(unpaid.finalPayRials).toBe(9_000_000n);

    expect(paid.unpaidBreakMinutes).toBe(0);
    expect(paid.paidBreakMinutes).toBe(30);
    expect(paid.payableMinutes).toBe(480);
    expect(paid.finalPayRials).toBe(9_600_000n);
  });

  it("exposes unapproved overtime without automatically paying it", () => {
    const result = calculateTimesheet({
      ...base,
      actualCheckOut: new Date("2026-08-16T17:00:00.000Z"),
    });

    expect(result.grossMinutes).toBe(540);
    expect(result.regularMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(60);
    expect(result.finalPayRials).toBe(9_600_000n);
    expect(result.requiresAdjustment).toBe(true);
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

  it("rejects invalid attendance ordering and negative monetary adjustments", () => {
    expect(() =>
      calculateTimesheet({
        ...base,
        actualCheckOut: new Date("2026-08-16T07:59:00.000Z"),
      })
    ).toThrow("INVALID_ATTENDANCE_SEQUENCE");

    expect(() => calculateTimesheet({ ...base, bonusRials: -1n })).toThrow(
      "INVALID_TIMESHEET_ADJUSTMENT"
    );
  });
});
