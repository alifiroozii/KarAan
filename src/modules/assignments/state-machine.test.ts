import { describe, it, expect } from "vitest";
import {
  AssignmentStateMachine,
  AssignmentState,
} from "./assignment.state-machine";

describe("AssignmentStateMachine Lifecycle", () => {
  it("should allow correct sequential lifecycle transitions", () => {
    const happyPath: AssignmentState[] = [
      "MATCHED",
      "ACCEPTED",
      "RECONFIRMED",
      "EN_ROUTE",
      "ARRIVED",
      "CHECKED_IN",
      "WORKING",
      "ON_BREAK",
      "WORKING",
      "CHECKED_OUT",
      "TIMESHEET_SUBMITTED",
      "APPROVED",
      "SETTLED",
    ];

    for (let i = 0; i < happyPath.length - 1; i++) {
      const current = happyPath[i];
      const next = happyPath[i + 1];
      expect(AssignmentStateMachine.canTransition(current, next)).toBe(true);
      expect(() =>
        AssignmentStateMachine.assertCanTransition(current, next)
      ).not.toThrow();
    }
  });

  it("should throw AppError on invalid transition attempts", () => {
    expect(() =>
      AssignmentStateMachine.assertCanTransition("MATCHED", "CHECKED_IN")
    ).toThrow();

    expect(() =>
      AssignmentStateMachine.assertCanTransition("SETTLED", "WORKING")
    ).toThrow();
  });
});
