import { describe, it, expect } from "vitest";
import {
  StateMachineService,
  ShiftStatus,
} from "@/modules/state-machine/state-machine.service";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";

describe("State Machine Service Unit Tests", () => {
  const service = new StateMachineService();

  describe("Shift Status Transitions", () => {
    it("should allow valid Shift transitions", () => {
      expect(service.canTransitionShift("DRAFT", "PUBLISHED")).toBe(true);
      expect(service.canTransitionShift("PUBLISHED", "MATCHING")).toBe(true);
      expect(service.canTransitionShift("MATCHING", "FILLED")).toBe(true);
      expect(service.canTransitionShift("FILLED", "IN_PROGRESS")).toBe(true);
      expect(service.canTransitionShift("IN_PROGRESS", "COMPLETED")).toBe(true);
      expect(service.canTransitionShift("COMPLETED", "APPROVED")).toBe(true);
      expect(service.canTransitionShift("APPROVED", "SETTLED")).toBe(true);
    });

    it("should reject invalid Shift transitions", () => {
      expect(service.canTransitionShift("SETTLED", "DRAFT")).toBe(false);
      expect(service.canTransitionShift("COMPLETED", "OFFERED" as unknown as ShiftStatus)).toBe(false);
      expect(service.canTransitionShift("CANCELLED", "PUBLISHED")).toBe(false);
      expect(service.canTransitionShift("EXPIRED", "IN_PROGRESS")).toBe(false);
    });
  });

  describe("ShiftAssignment State Transitions", () => {
    it("should allow valid Assignment transitions", () => {
      expect(service.canTransitionAssignment("OFFERED", "VIEWED")).toBe(true);
      expect(service.canTransitionAssignment("VIEWED", "ACCEPTED")).toBe(true);
      expect(service.canTransitionAssignment("ACCEPTED", "CONFIRMED")).toBe(true);
      expect(service.canTransitionAssignment("CONFIRMED", "EN_ROUTE")).toBe(true);
      expect(service.canTransitionAssignment("EN_ROUTE", "ARRIVED")).toBe(true);
      expect(service.canTransitionAssignment("ARRIVED", "CHECKED_IN")).toBe(true);
      expect(service.canTransitionAssignment("CHECKED_IN", "ON_BREAK")).toBe(true);
      expect(service.canTransitionAssignment("ON_BREAK", "CHECKED_OUT")).toBe(true);
      expect(service.canTransitionAssignment("CHECKED_OUT", "COMPLETED")).toBe(true);
    });

    it("should reject invalid Assignment transitions (e.g. COMPLETED -> OFFERED)", () => {
      expect(service.canTransitionAssignment("COMPLETED", "OFFERED")).toBe(false);
      expect(service.canTransitionAssignment("COMPLETED", "ACCEPTED")).toBe(false);
      expect(service.canTransitionAssignment("DECLINED", "CHECKED_IN")).toBe(false);
      expect(service.canTransitionAssignment("NO_SHOW", "EN_ROUTE")).toBe(false);
      expect(service.canTransitionAssignment("CANCELLED_BY_WORKER", "CONFIRMED")).toBe(false);
    });

    it("should throw AppError on invalid transition assertion", () => {
      expect(() =>
        AssignmentStateMachine.assertCanTransition("COMPLETED", "OFFERED")
      ).toThrowError("تغییر وضعیت نامعتبر از COMPLETED به OFFERED");
    });
  });
});
