import { QueryClient } from "@tanstack/react-query";
import { RealtimeEventName } from "./events";

export type RealtimeQueryKey = readonly unknown[];

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
    case "payment.updated":
      return [["payments"], ["employer", "payments"]];
    case "wallet.updated":
      return [["wallet"], ["wallet", "transactions"], ["employer", "wallet"], ["worker", "wallet"]];
    case "notification.created":
    case "notification.delivery.updated":
      return [["notifications"], ["notifications", "unread-count"]];
    case "chat.message":
    case "chat.read":
      return [["conversations"], ["messages"]];
    case "dispute.updated":
      return [["disputes"]];
    case "reliability.updated":
    case "strike.created":
    case "sanction.created":
    case "sanction.revoked":
      return [["worker", "reliability"], ["worker", "availability"], ["worker", "offers"]];
    case "worker.break_started":
    case "worker.break_ended":
    case "worker.break_limit_warning":
    case "overtime.requested":
    case "overtime.accepted":
    case "overtime.declined":
    case "overtime.cancelled":
    case "overtime.expired":
    case "worker.en_route":
    case "worker.arrived":
    case "worker.checked_in":
    case "worker.checked_out":
    case "worker.late_risk":
    case "no_show.potential":
    case "no_show.finalized":
    case "no_show.overridden":
    case "no_show.detected":
    case "backfill.requested":
    case "backfill.offers_dispatched":
    case "backfill.filled":
    case "backfill.exhausted":
    case "backfill.cancelled":
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
  const userId = payload.userId as string | undefined;
  const shiftId = payload.shiftId as string | undefined;
  const timesheetId = payload.timesheetId as string | undefined;
  const paymentId = payload.paymentId as string | undefined;
  const walletId = payload.walletId as string | undefined;
  const notificationId = payload.notificationId as string | undefined;
  const conversationId = payload.conversationId as string | undefined;
  const disputeId = payload.disputeId as string | undefined;

  if (assignmentId) {
    keys.push(["assignment", assignmentId]);
    if (event.startsWith("overtime.")) keys.push(["worker", "overtime", assignmentId]);
    if (event.startsWith("worker.break_")) keys.push(["worker", "break", assignmentId]);
  }
  if (workerId) {
    keys.push(["worker", workerId]);
    if (
      event === "reliability.updated" ||
      event === "strike.created" ||
      event === "sanction.created" ||
      event === "sanction.revoked"
    ) {
      keys.push(["worker", "reliability"]);
      keys.push(["admin", "worker", workerId, "reliability"]);
    }
  }
  if (userId && event === "wallet.updated") keys.push(["wallet", userId]);
  if (userId && event.startsWith("notification.")) keys.push(["notifications", userId]);
  if (notificationId) keys.push(["notification", notificationId]);
  if (walletId) keys.push(["wallet", walletId]);
  if (shiftId) {
    keys.push(["shift", shiftId]);
    if (event.startsWith("no_show.") || event.startsWith("backfill.")) {
      keys.push(["shift", shiftId, "assignments"]);
      keys.push(["employer", "backfill", shiftId]);
    }
  }
  if (event === "offer.created" || event === "offer.expired" || event === "offer.accepted") {
    keys.push(["worker", "offers"]);
  }
  if (timesheetId) keys.push(["timesheet", timesheetId]);
  if (event === "timesheet.updated") keys.push(["worker", "timesheets"]);
  if (paymentId) keys.push(["payment", paymentId]);
  if (conversationId) keys.push(["messages", conversationId], ["conversation", conversationId]);
  if (disputeId) keys.push(["dispute", disputeId]);

  const seen = new Set<string>();
  for (const queryKey of keys) {
    const signature = JSON.stringify(queryKey);
    if (seen.has(signature)) continue;
    seen.add(signature);
    void queryClient.invalidateQueries({ queryKey });
  }
}
