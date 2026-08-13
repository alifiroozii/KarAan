import { describe, it, expect } from "vitest";
import { AssignmentStateMachine } from "./assignment.state-machine";

describe("AssignmentStateMachine Unit Tests", () => {
  it("should allow valid progressive transitions", () => {
    expect(AssignmentStateMachine.canTransition("OFFERED", "VIEWED")).toBe(true);
    expect(AssignmentStateMachine.canTransition("VIEWED", "ACCEPTED")).toBe(true);
    expect(AssignmentStateMachine.canTransition("ACCEPTED", "CONFIRMED")).toBe(true);
    expect(AssignmentStateMachine.canTransition("CONFIRMED", "EN_ROUTE")).toBe(true);
    expect(AssignmentStateMachine.canTransition("EN_ROUTE", "ARRIVED")).toBe(true);
    expect(AssignmentStateMachine.canTransition("ARRIVED", "CHECKED_IN")).toBe(true);
    expect(AssignmentStateMachine.canTransition("CHECKED_IN", "ON_BREAK")).toBe(true);
    expect(AssignmentStateMachine.canTransition("ON_BREAK", "CHECKED_OUT")).toBe(true);
    expect(AssignmentStateMachine.canTransition("CHECKED_OUT", "COMPLETED")).toBe(true);
  });

  it("should reject invalid transitions (e.g. COMPLETED -> OFFERED)", () => {
    expect(AssignmentStateMachine.canTransition("COMPLETED", "OFFERED")).toBe(false);
    expect(AssignmentStateMachine.canTransition("COMPLETED", "ACCEPTED")).toBe(false);
    expect(AssignmentStateMachine.canTransition("DECLINED", "CHECKED_IN")).toBe(false);
  });

  it("should throw AppError on invalid transition assertion", () => {
    expect(() =>
      AssignmentStateMachine.assertCanTransition("COMPLETED", "OFFERED")
    ).toThrowError("تغییر وضعیت نامعتبر از COMPLETED به OFFERED");
  });
});
