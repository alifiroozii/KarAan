import { RealtimeEventName } from "./events";

/**
 * Map Realtime Events to TanStack Query Keys for cache invalidation
 */
export function getQueryKeysToInvalidate(event: RealtimeEventName, payload: Record<string, unknown>): string[][] {
  const shiftId = String(payload.shiftId || "");
  const workerId = String(payload.workerId || "");

  switch (event) {
    case "shift.created":
    case "shift.published":
    case "shift.updated":
    case "shift.filled":
      return [["shifts"], ["employer", "shifts"], ["worker", "radar"]];

    case "offer.created":
    case "offer.accepted":
    case "offer.expired":
      return [["offers"], ["shift", shiftId], ["worker", "offers"]];

    case "assignment.updated":
    case "worker.en_route":
    case "worker.arrived":
    case "worker.checked_in":
    case "worker.checked_out":
      return [["assignments"], ["shift", shiftId], ["timesheets"]];

    case "timesheet.updated":
      return [["timesheets"], ["employer", "timesheets"], ["worker", "earnings"]];

    case "payment.updated":
      return [["wallet"], ["transactions"]];

    case "worker.location.updated":
      return [["live_locations"], ["worker", workerId]];

    default:
      return [];
  }
}
