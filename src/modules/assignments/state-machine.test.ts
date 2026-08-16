import { describe, expect, it } from "vitest";
import { AssignmentStateMachine } from "./assignment.state-machine";

describe("AssignmentStateMachine", () => {
  it("allows confirmed worker to start route", () => {
    expect(AssignmentStateMachine.canTransition("CONFIRMED", "EN_ROUTE")).toBe(true);
  });

  it("requires arrival before check-in", () => {
    expect(AssignmentStateMachine.canTransition("EN_ROUTE", "CHECKED_IN")).toBe(false);
    expect(AssignmentStateMachine.canTransition("ARRIVED", "CHECKED_IN")).toBe(true);
  });

  it("does not allow terminal assignments to restart", () => {
    expect(AssignmentStateMachine.canTransition("COMPLETED", "EN_ROUTE")).toBe(false);
    expect(AssignmentStateMachine.canTransition("NO_SHOW", "EN_ROUTE")).toBe(false);
  });

  it("throws a domain error for invalid transitions", () => {
    expect(() => AssignmentStateMachine.assertCanTransition("CONFIRMED", "CHECKED_IN")).toThrow();
  });
});
