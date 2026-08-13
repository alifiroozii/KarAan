import { AppError } from "@/lib/errors";

export type AssignmentState =
  | "MATCHED"
  | "ACCEPTED"
  | "RECONFIRMED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "CHECKED_IN"
  | "WORKING"
  | "ON_BREAK"
  | "CHECKED_OUT"
  | "TIMESHEET_SUBMITTED"
  | "APPROVED"
  | "SETTLED"
  | "CANCELLED";

const VALID_TRANSITIONS: Record<AssignmentState, AssignmentState[]> = {
  MATCHED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["RECONFIRMED", "CANCELLED"],
  RECONFIRMED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["WORKING", "CANCELLED"],
  WORKING: ["ON_BREAK", "CHECKED_OUT", "CANCELLED"],
  ON_BREAK: ["WORKING", "CHECKED_OUT", "CANCELLED"],
  CHECKED_OUT: ["TIMESHEET_SUBMITTED"],
  TIMESHEET_SUBMITTED: ["APPROVED", "CANCELLED"],
  APPROVED: ["SETTLED"],
  SETTLED: [],
  CANCELLED: [],
};

export class AssignmentStateMachine {
  public static canTransition(
    currentState: AssignmentState,
    nextState: AssignmentState
  ): boolean {
    const allowed = VALID_TRANSITIONS[currentState] || [];
    return allowed.includes(nextState);
  }

  public static assertCanTransition(
    currentState: AssignmentState,
    nextState: AssignmentState
  ): void {
    if (!this.canTransition(currentState, nextState)) {
      throw new AppError(
        `تغییر وضعیت نامعتبر از ${currentState} به ${nextState}`,
        "INVALID_STATE_TRANSITION",
        400,
        { currentState, nextState }
      );
    }
  }
}
