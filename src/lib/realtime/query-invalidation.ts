import { QueryClient } from "@tanstack/react-query";
import { RealtimeEventName } from "./events";

export type RealtimeQueryKey = readonly unknown[];

/**
 * Stable public mapping retained for existing consumers/tests.
 * Entity-specific keys are added by invalidateQueriesForRealtimeEvent so this
 * helper remains backwards compatible.
 */
export function getQueryKeysToInvalidate(
  event: RealtimeEventName,
  _payload: Record<string, unknown>
): RealtimeQueryKey[] {
  switch (event) {
    case "shift.created":
    case "shift.updated":
    case "shift.published":
    case "shift.filled":
      return [["shifts"], ["employer", "shifts"], ["worker", "radar"]];
    case "timesheet.updated":
      return [["timesheets"], ["employer", "timesheets"], ["worker", "earnings"]];
    case "worker.en_route":
    case "worker.arrived":
    case "worker.checked_in":
    case "worker.checked_out":
    case "worker.late_risk":
    case "assignment.updated":
      return [["worker", "current-shift"], ["employer", "live"], ["employer", "shifts"]];
    default:
      return [];
  }
}

export function invalidateQueriesForRealtimeEvent(
  queryClient: QueryClient,
  event: RealtimeEventName,
  payload: Record<string, unknown>
): void {
  const keys: RealtimeQueryKey[] = [...getQueryKeysToInvalidate(event, payload)];
  const assignmentId = payload.assignmentId as string | undefined;
  const workerId = payload.workerId as string | undefined;
  const shiftId = payload.shiftId as string | undefined;

  if (assignmentId) keys.push(["assignment", assignmentId]);
  if (workerId) keys.push(["worker", workerId]);
  if (shiftId) keys.push(["shift", shiftId]);

  const seen = new Set<string>();
  for (const queryKey of keys) {
    const signature = JSON.stringify(queryKey);
    if (seen.has(signature)) continue;
    seen.add(signature);
    void queryClient.invalidateQueries({ queryKey });
  }
}
