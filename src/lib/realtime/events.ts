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
  | "worker.break_started"
  | "worker.break_ended"
  | "worker.break_limit_warning"
  | "worker.late_risk"
  | "overtime.requested"
  | "overtime.accepted"
  | "overtime.declined"
  | "overtime.cancelled"
  | "overtime.expired"
  | "no_show.potential"
  | "no_show.finalized"
  | "no_show.overridden"
  | "no_show.detected"
  | "backfill.requested"
  | "backfill.offers_dispatched"
  | "backfill.filled"
  | "backfill.exhausted"
  | "backfill.cancelled"
  | "reliability.updated"
  | "strike.created"
  | "sanction.created"
  | "sanction.revoked"
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
  "assignment.updated": { assignmentId: string; state: string; shiftId?: string };
  "worker.en_route": {
    assignmentId: string;
    workerId: string;
    shiftId?: string;
    distanceMeters: number;
    durationSeconds: number;
    estimatedArrivalAt: string;
    lateRisk: "ON_TIME" | "RISK_OF_LATE" | "LATE";
  };
  "worker.arrived": { assignmentId: string; workerId: string; shiftId?: string };
  "worker.checked_in": {
    assignmentId: string;
    workerId: string;
    shiftId?: string;
    checkedInAt: string;
  };
  "worker.checked_out": {
    assignmentId: string;
    workerId: string;
    shiftId?: string;
    checkedOutAt: string;
  };
  "worker.break_started": {
    assignmentId: string;
    workerId: string;
    shiftId: string;
    breakId: string;
    startedAt: string;
  };
  "worker.break_ended": {
    assignmentId: string;
    workerId: string;
    shiftId: string;
    breakId: string;
    endedAt: string;
    durationMinutes: number;
  };
  "worker.break_limit_warning": {
    assignmentId: string;
    workerId: string;
    shiftId: string;
    usedMinutes: number;
    allowedMinutes: number;
  };
  "worker.late_risk": {
    assignmentId: string;
    workerId: string;
    shiftId?: string;
    lateRisk: "RISK_OF_LATE" | "LATE";
    estimatedArrivalAt: string;
  };
  "overtime.requested": {
    overtimeRequestId: string;
    assignmentId: string;
    shiftId: string;
    workerId: string;
    requestedEndAt: string;
    expiresAt: string;
  };
  "overtime.accepted": {
    overtimeRequestId: string;
    assignmentId: string;
    shiftId: string;
    workerId: string;
    requestedEndAt: string;
  };
  "overtime.declined": {
    overtimeRequestId: string;
    assignmentId: string;
    shiftId: string;
    workerId: string;
  };
  "overtime.cancelled": {
    overtimeRequestId: string;
    assignmentId: string;
    shiftId: string;
    workerId: string;
  };
  "overtime.expired": {
    overtimeRequestId: string;
    assignmentId: string;
    shiftId: string;
    workerId: string;
  };
  "no_show.potential": {
    noShowEventId: string;
    assignmentId: string;
    workerId: string;
    shiftId: string;
    finalizesAt: string;
  };
  "no_show.finalized": {
    noShowEventId: string;
    assignmentId: string;
    workerId: string;
    shiftId: string;
    previousState: string;
  };
  "no_show.overridden": {
    noShowEventId: string;
    assignmentId: string;
    workerId: string;
    shiftId: string;
    reason: string;
  };
  "no_show.detected": { assignmentId: string; workerId: string };
  "backfill.requested": { shiftId: string; neededSlots: number };
  "backfill.offers_dispatched": {
    backfillRequestId: string;
    shiftId: string;
    shiftSlotId: string;
    offersCreated: number;
    expiresAt: string;
  };
  "backfill.filled": {
    backfillRequestId: string;
    shiftId: string;
    shiftSlotId: string;
    assignmentId: string;
  };
  "backfill.exhausted": {
    backfillRequestId: string;
    shiftId: string;
    shiftSlotId: string;
  };
  "backfill.cancelled": {
    backfillRequestId: string;
    shiftId: string;
    shiftSlotId: string;
    reason: string;
  };
  "reliability.updated": {
    workerId: string;
    eventId: string;
    scoreDelta: number;
    resultingScore: number;
  };
  "strike.created": { workerId: string; strikeId: string };
  "sanction.created": { workerId: string; sanctionId: string; sanctionType: string };
  "sanction.revoked": { workerId: string; reason: string };
  "timesheet.updated": { timesheetId: string; status: string };
  "payment.updated": { transactionId: string; amountRials: string };
  "chat.message": { conversationId: string; senderId: string; content: string };
}
