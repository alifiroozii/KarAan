import { describe, expect, it } from "vitest";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";
import {
  assertCancellationReason,
  calculateScheduledPayRials,
  DEFAULT_EMPLOYER_CANCELLATION_POLICY,
  DEFAULT_WORKER_CANCELLATION_POLICY,
  evaluateCancellationPolicy,
  normalizeCancellationPolicy,
} from "./cancellation-policy";

const shiftStartAt = new Date("2026-08-17T12:00:00.000Z");
const scheduledPayRials = 10_000_000n;

describe("cancellation policy", () => {
  it("keeps early worker cancellation penalty-free", () => {
    const result = evaluateCancellationPolicy({
      now: new Date("2026-08-16T06:00:00.000Z"),
      shiftStartAt,
      scheduledPayRials,
      policy: DEFAULT_WORKER_CANCELLATION_POLICY,
    });
    expect(result.hoursBeforeStart).toBe(30);
    expect(result.penaltyRials).toBe(0n);
    expect(result.isLate).toBe(false);
  });

  it("applies the configured late worker tier deterministically", () => {
    const result = evaluateCancellationPolicy({
      now: new Date("2026-08-17T07:00:00.000Z"),
      shiftStartAt,
      scheduledPayRials,
      policy: DEFAULT_WORKER_CANCELLATION_POLICY,
    });
    expect(result.hoursBeforeStart).toBe(5);
    expect(result.penaltyRials).toBe(1_000_000n);
    expect(result.workerCompensationRials).toBe(0n);
    expect(result.scoreImpact).toBe(-8);
    expect(result.isLate).toBe(true);
  });

  it("records employer late-cancellation compensation without settling it", () => {
    const result = evaluateCancellationPolicy({
      now: new Date("2026-08-17T11:00:00.000Z"),
      shiftStartAt,
      scheduledPayRials,
      policy: DEFAULT_EMPLOYER_CANCELLATION_POLICY,
    });
    expect(result.penaltyRials).toBe(1_000_000n);
    expect(result.workerCompensationRials).toBe(5_000_000n);
    expect(result.scoreImpact).toBe(-15);
  });

  it("treats cancellation after start as the strictest time tier", () => {
    const result = evaluateCancellationPolicy({
      now: new Date("2026-08-17T12:30:00.000Z"),
      shiftStartAt,
      scheduledPayRials,
      policy: DEFAULT_WORKER_CANCELLATION_POLICY,
    });
    expect(result.minutesBeforeStart).toBe(-30);
    expect(result.penaltyRials).toBe(2_000_000n);
    expect(result.isLate).toBe(true);
  });

  it("calculates scheduled pay in integer Rials", () => {
    expect(
      calculateScheduledPayRials({
        startAt: new Date("2026-08-17T08:00:00.000Z"),
        endAt: new Date("2026-08-17T16:00:00.000Z"),
        hourlyPayRials: 1_200_000n,
      })
    ).toBe(9_600_000n);
  });

  it("normalizes custom policy values and retains a catch-all tier", () => {
    const policy = normalizeCancellationPolicy(
      {
        lateThresholdHours: 4,
        tiers: [{ maxHoursBeforeStart: 1, penaltyBps: 2500, workerCompensationBps: 500, scoreImpact: -12 }],
      },
      DEFAULT_WORKER_CANCELLATION_POLICY
    );
    expect(policy.lateThresholdHours).toBe(4);
    expect(policy.tiers[0].penaltyBps).toBe(2500);
    expect(policy.tiers.at(-1)?.maxHoursBeforeStart).toBeNull();
  });

  it("enforces side-specific reasons and OTHER description", () => {
    expect(() => assertCancellationReason("WORKER", "SICKNESS")).not.toThrow();
    expect(() => assertCancellationReason("WORKER", "BUSINESS_CLOSED")).toThrow(
      "INVALID_CANCELLATION_REASON"
    );
    expect(() => assertCancellationReason("EMPLOYER", "OTHER", "short")).toThrow(
      "CANCELLATION_DESCRIPTION_REQUIRED"
    );
  });

  it("allows cancellation only before attendance starts", () => {
    expect(AssignmentStateMachine.canTransition("CONFIRMED", "CANCELLED_BY_WORKER")).toBe(true);
    expect(AssignmentStateMachine.canTransition("ARRIVED", "CANCELLED_BY_EMPLOYER")).toBe(true);
    expect(AssignmentStateMachine.canTransition("CHECKED_IN", "CANCELLED_BY_WORKER")).toBe(false);
    expect(AssignmentStateMachine.canTransition("ON_BREAK", "CANCELLED_BY_EMPLOYER")).toBe(false);
  });
});
