export type TimesheetLifecycleStatus =
  | "SUBMITTED"
  | "APPROVED"
  | "DISPUTED"
  | "ADJUSTMENT_REQUIRED"
  | "READY_FOR_SETTLEMENT"
  | "SETTLED"
  | "VOID";

const TRANSITIONS: Record<TimesheetLifecycleStatus, readonly TimesheetLifecycleStatus[]> = {
  SUBMITTED: ["ADJUSTMENT_REQUIRED", "DISPUTED", "READY_FOR_SETTLEMENT", "VOID"],
  APPROVED: ["READY_FOR_SETTLEMENT", "VOID"],
  DISPUTED: ["SUBMITTED", "ADJUSTMENT_REQUIRED", "VOID"],
  ADJUSTMENT_REQUIRED: ["SUBMITTED", "DISPUTED", "VOID"],
  READY_FOR_SETTLEMENT: ["SETTLED", "VOID"],
  SETTLED: [],
  VOID: [],
};

export function canTransitionTimesheet(
  from: TimesheetLifecycleStatus,
  to: TimesheetLifecycleStatus
): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}
