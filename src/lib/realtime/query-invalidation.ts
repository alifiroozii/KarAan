import { QueryClient } from "@tanstack/react-query";
import { RealtimeEventName } from "./events";

export type RealtimeQueryKey = readonly unknown[];

export function getQueryKeysToInvalidate(
  event: RealtimeEventName,
  payload: Record<string, unknown>
): RealtimeQueryKey[] {
  const assignmentId = payload.assignmentId as string | undefined;
  const workerId = payload.workerId as string | undefined;
  const shiftId = payload.shiftId as string | undefined;
  const keys: RealtimeQueryKey[] = [];

  switch (event) {
    case "shift.created":
    case "shift.updated":
    case "shift.published":
    case "shift.filled":
      keys.push(["shifts"], ["employer", "shifts"], ["worker", "radar"]);
      break;
    case "timesheet.updated":
      keys.push(["timesheets"], ["employer", "timesheets"], ["worker", "earnings"]);
      break;
    case "worker.en_route":
    case "worker.arrived":
    case "worker.checked_in":
    case "worker.checked_out":
    case "worker.late_risk":
    case "assignment.updated":
      keys.push(["worker", "current-shift"], ["employer", "live"], ["employer", "shifts"]);
      break;
    default:
      break;
  }

  if (assignmentId) keys.push(["assignment", assignmentId]);
  if (workerId) keys.push(["worker", workerId]);
  if (shiftId) keys.push(["shift", shiftId]);

  const seen = new Set<string>();
  return keys.filter((key) => {
    const signature = JSON.stringify(key);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export function invalidateQueriesForRealtimeEvent(
  queryClient: QueryClient,
  event: RealtimeEventName,
  payload: Record<string, unknown>
): void {
  for (const queryKey of getQueryKeysToInvalidate(event, payload)) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
