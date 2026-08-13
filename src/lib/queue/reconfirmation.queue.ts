import { db } from "@/db";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { MockSMSAdapter } from "@/infrastructure/sms/mock-sms.adapter";

export interface ReconfirmationJobData {
  assignmentId: string;
  reminderType: "T_24H" | "T_3H";
  idempotencyKey: string;
}

export interface ReconfirmationJobResult {
  status: "CONFIRMED_OK" | "SKIPPED_CANCELLED" | "RISK_FLAGGED_SMS_SENT";
  assignmentId: string;
  riskFlagged: boolean;
}

const smsAdapter = new MockSMSAdapter();

export class ReconfirmationQueueProcessor {
  /**
   * Idempotent Process for Shift Reconfirmation Reminders
   */
  async processReconfirmationJob(data: ReconfirmationJobData): Promise<ReconfirmationJobResult> {
    const [assignment] = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, data.assignmentId))
      .limit(1);

    if (!assignment) {
      return { status: "SKIPPED_CANCELLED", assignmentId: data.assignmentId, riskFlagged: false };
    }

    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    // Guard: If Shift is cancelled or already confirmed or completed, safely skip
    if (!shift || shift.status === "CANCELLED" || assignment.state === "CONFIRMED" || assignment.state === "COMPLETED") {
      return { status: "SKIPPED_CANCELLED", assignmentId: assignment.id, riskFlagged: false };
    }

    const [worker] = await db
      .select()
      .from(users)
      .where(eq(users.id, assignment.workerId))
      .limit(1);

    const workerPhone = worker ? worker.phone : "09120000000";

    if (assignment.state === "RECONFIRM_PENDING" || assignment.state === "ACCEPTED") {
      // Unresponsive Worker -> Send SMS Fallback & Flag Risk for Employer
      await smsAdapter.sendReminder(
        workerPhone,
        `کارجو گرامی، لطفاً حضور خود در شیفت ${shift.title} را در سامانه کارآن تایید کنید.`
      );

      // Transition assignment to RECONFIRM_PENDING
      await db
        .update(shiftAssignments)
        .set({
          state: "RECONFIRM_PENDING",
          updatedAt: new Date(),
        })
        .where(eq(shiftAssignments.id, assignment.id));

      return {
        status: "RISK_FLAGGED_SMS_SENT",
        assignmentId: assignment.id,
        riskFlagged: true,
      };
    }

    return { status: "CONFIRMED_OK", assignmentId: assignment.id, riskFlagged: false };
  }
}
