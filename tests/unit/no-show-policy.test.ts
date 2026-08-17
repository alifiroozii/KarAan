import { describe, expect, it } from "vitest";
import {
  DEFAULT_NO_SHOW_POLICY,
  evaluateNoShowAt,
  isNoShowEligibleState,
  normalizeNoShowPolicy,
} from "@/modules/no-show/no-show-policy";

const start = new Date("2026-08-17T08:00:00.000Z");

function atMinute(minutes: number) {
  return new Date(start.getTime() + minutes * 60_000);
}

describe("no-show policy", () => {
  it("does not flag before grace period", () => {
    expect(
      evaluateNoShowAt({
        shiftStartAt: start,
        now: atMinute(9),
        policy: DEFAULT_NO_SHOW_POLICY,
      })
    ).toEqual({ decision: "NOT_DUE", minutesAfterStart: 9 });
  });

  it("creates potential no-show at grace boundary", () => {
    expect(
      evaluateNoShowAt({
        shiftStartAt: start,
        now: atMinute(10),
        policy: DEFAULT_NO_SHOW_POLICY,
      })
    ).toEqual({ decision: "POTENTIAL", minutesAfterStart: 10 });
  });

  it("finalizes no-show at final threshold", () => {
    expect(
      evaluateNoShowAt({
        shiftStartAt: start,
        now: atMinute(20),
        policy: DEFAULT_NO_SHOW_POLICY,
      })
    ).toEqual({ decision: "FINAL", minutesAfterStart: 20 });
  });

  it("normalizes invalid settings and keeps final threshold after grace", () => {
    expect(
      normalizeNoShowPolicy({
        gracePeriodMinutes: 30,
        finalThresholdMinutes: 5,
        reliabilityPenalty: 140,
        strikeRecommended: false,
      })
    ).toEqual({
      gracePeriodMinutes: 30,
      finalThresholdMinutes: 31,
      reliabilityPenalty: 100,
      strikeRecommended: false,
    });
  });

  it("only permits pre-attendance states to become no-show", () => {
    expect(isNoShowEligibleState("RECONFIRM_PENDING")).toBe(true);
    expect(isNoShowEligibleState("CONFIRMED")).toBe(true);
    expect(isNoShowEligibleState("EN_ROUTE")).toBe(true);
    expect(isNoShowEligibleState("ARRIVED")).toBe(true);
    expect(isNoShowEligibleState("CHECKED_IN")).toBe(false);
    expect(isNoShowEligibleState("COMPLETED")).toBe(false);
  });
});
