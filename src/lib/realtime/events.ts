export type RealtimeEventName =
  | "worker.online"
  | "worker.offline"
  | "worker.location.updated"
  | "shift.created"
  | "shift.updated"
  | "shift.published"
  | "shift.filled"
  | "offer.created"
  | "offer.accepted"
  | "offer.expired"
  | "assignment.updated"
  | "worker.en_route"
  | "worker.arrived"
  | "worker.checked_in"
  | "worker.checked_out"
  | "worker.late_risk"
  | "no_show.detected"
  | "backfill.requested"
  | "timesheet.updated"
  | "payment.updated"
  | "chat.message";

export interface RealtimeEventPayloads {
  "worker.online": { workerId: string; timestamp: number };
  "worker.offline": { workerId: string; timestamp: number };
  "worker.location.updated": { workerId: string; latitude: number; longitude: number };
  "shift.created": { shiftId: string; title: string };
  "shift.updated": { shiftId: string; status: string };
  "shift.published": { shiftId: string; publishedAt: string };
  "shift.filled": { shiftId: string; slotsCount: number };
  "offer.created": { offerId: string; shiftSlotId: string; workerId: string };
  "offer.accepted": { offerId: string; assignmentId: string };
  "offer.expired": { offerId: string };
  "assignment.updated": { assignmentId: string; state: string };
  "worker.en_route": {
    assignmentId: string;
    workerId: string;
    distanceMeters: number;
    durationSeconds: number;
    estimatedArrivalAt: string;
    lateRisk: "ON_TIME" | "RISK_OF_LATE" | "LATE";
  };
  "worker.arrived": { assignmentId: string; workerId: string };
  "worker.checked_in": { assignmentId: string; workerId: string; checkedInAt: string };
  "worker.checked_out": { assignmentId: string; workerId: string; checkedOutAt: string };
  "worker.late_risk": {
    assignmentId: string;
    workerId: string;
    lateRisk: "RISK_OF_LATE" | "LATE";
    estimatedArrivalAt: string;
  };
  "no_show.detected": { assignmentId: string; workerId: string };
  "backfill.requested": { shiftId: string; neededSlots: number };
  "timesheet.updated": { timesheetId: string; status: string };
  "payment.updated": { transactionId: string; amountRials: string };
  "chat.message": { conversationId: string; senderId: string; content: string };
}
