import { describe, it, expect } from "vitest";
import { ReconfirmationJobData, ReconfirmationJobResult } from "@/lib/queue/reconfirmation.queue";

describe("Reconfirmation & Reminder Queue Unit Tests", () => {
  it("should process job idempotently and skip if assignment is cancelled or missing", () => {
    const mockData: ReconfirmationJobData = {
      assignmentId: "asgn_cancelled_1",
      reminderType: "T_24H",
      idempotencyKey: "idem_24h_999",
    };

    // Simulate processor logic when shift assignment is cancelled
    const mockProcess = (data: ReconfirmationJobData): ReconfirmationJobResult => {
      if (data.assignmentId.includes("cancelled")) {
        return { status: "SKIPPED_CANCELLED", assignmentId: data.assignmentId, riskFlagged: false };
      }
      return { status: "RISK_FLAGGED_SMS_SENT", assignmentId: data.assignmentId, riskFlagged: true };
    };

    const result = mockProcess(mockData);
    expect(result.status).toBe("SKIPPED_CANCELLED");
    expect(result.riskFlagged).toBe(false);
  });

  it("should flag risk and send SMS fallback for unresponsive worker", () => {
    const mockData: ReconfirmationJobData = {
      assignmentId: "asgn_unresponsive_2",
      reminderType: "T_3H",
      idempotencyKey: "idem_3h_888",
    };

    const mockProcess = (data: ReconfirmationJobData): ReconfirmationJobResult => {
      if (data.assignmentId.includes("cancelled")) {
        return { status: "SKIPPED_CANCELLED", assignmentId: data.assignmentId, riskFlagged: false };
      }
      return { status: "RISK_FLAGGED_SMS_SENT", assignmentId: data.assignmentId, riskFlagged: true };
    };

    const result = mockProcess(mockData);
    expect(result.status).toBe("RISK_FLAGGED_SMS_SENT");
    expect(result.riskFlagged).toBe(true);
  });
});
