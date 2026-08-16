import { describe, expect, it } from "vitest";
import { canTransitionTimesheet } from "./timesheet-lifecycle";

describe("timesheet lifecycle", () => {
  it("allows employer review to prepare a submitted timesheet for settlement", () => {
    expect(canTransitionTimesheet("SUBMITTED", "READY_FOR_SETTLEMENT")).toBe(true);
  });

  it("blocks settlement before adjustment-required overtime is resolved", () => {
    expect(
      canTransitionTimesheet("ADJUSTMENT_REQUIRED", "READY_FOR_SETTLEMENT")
    ).toBe(false);
  });

  it("allows disputed timesheets to return to a reviewable state", () => {
    expect(canTransitionTimesheet("DISPUTED", "SUBMITTED")).toBe(true);
    expect(canTransitionTimesheet("DISPUTED", "ADJUSTMENT_REQUIRED")).toBe(true);
  });

  it("makes settled and void timesheets terminal", () => {
    expect(canTransitionTimesheet("SETTLED", "SUBMITTED")).toBe(false);
    expect(canTransitionTimesheet("VOID", "SUBMITTED")).toBe(false);
  });
});
