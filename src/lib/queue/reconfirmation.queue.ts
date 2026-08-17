import { db } from "@/db";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { eq } from "drizzle-orm";
import { NotificationService } from "@/modules/notifications/notification.service";

export interface ReconfirmationJobData {
  assignmentId: string;
  reminderType: "T_24H" | "T_3H";
  idempotencyKey: string;
}

export interface ReconfirmationJobResult {
  status:
    | "CONFIRMED_OK"
    | "SKIPPED_CANCELLED"
    | "RISK_FLAGGED_NOTIFICATION_QUEUED";
  assignmentId: string;
  riskFlagged: boolean;
}

const notificationService = new NotificationService();

export class ReconfirmationQueueProcessor {
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

    if (
      !shift ||
      shift.status === "CANCELLED" ||
      assignment.state === "CONFIRMED" ||
      assignment.state === "COMPLETED"
    ) {
      return { status: "SKIPPED_CANCELLED", assignmentId: assignment.id, riskFlagged: false };
    }

    if (assignment.state === "RECONFIRM_PENDING" || assignment.state === "ACCEPTED") {
      await db
        .update(shiftAssignments)
        .set({
          state: "RECONFIRM_PENDING",
          updatedAt: new Date(),
        })
        .where(eq(shiftAssignments.id, assignment.id));

      await notificationService.createNotification({
        userId: assignment.workerId,
        type: "RECONFIRM_REMINDER",
        title: data.reminderType === "T_24H" ? "یادآوری تأیید شیفت" : "تأیید نهایی شیفت",
        body: `لطفاً حضور خود در شیفت «${shift.title}» را در کارآن تأیید کنید.`,
        data: {
          assignmentId: assignment.id,
          shiftId: shift.id,
          reminderType: data.reminderType,
        },
        idempotencyKey: `reconfirm:${assignment.id}:${data.reminderType}:${data.idempotencyKey}`,
        channels: ["SMS", "PUSH"],
      });

      return {
        status: "RISK_FLAGGED_NOTIFICATION_QUEUED",
        assignmentId: assignment.id,
        riskFlagged: true,
      };
    }

    return { status: "CONFIRMED_OK", assignmentId: assignment.id, riskFlagged: false };
  }
}
