import { QueryClient } from "@tanstack/react-query";
import { RealtimeEventName } from "./events";

export function invalidateQueriesForRealtimeEvent(
  queryClient: QueryClient,
  event: RealtimeEventName,
  payload: Record<string, unknown>
): void {
  const assignmentId = payload.assignmentId as string | undefined;
  const workerId = payload.workerId as string | undefined;
  const shiftId = payload.shiftId as string | undefined;

  if (assignmentId) {
    void queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
    void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
  }

  if (workerId) {
    void queryClient.invalidateQueries({ queryKey: ["worker", workerId] });
  }

  if (shiftId) {
    void queryClient.invalidateQueries({ queryKey: ["shift", shiftId] });
  }

  switch (event) {
    case "worker.en_route":
    case "worker.arrived":
    case "worker.checked_in":
    case "worker.checked_out":
    case "worker.late_risk":
    case "assignment.updated":
      void queryClient.invalidateQueries({ queryKey: ["employer", "live"] });
      void queryClient.invalidateQueries({ queryKey: ["employer", "shifts"] });
      break;
    case "timesheet.updated":
      void queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      break;
    default:
      break;
  }
}
