import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { backfillRequests } from "@/db/schema/backfill";
import { cancellations, noShowEvents } from "@/db/schema/reliability";
import { shiftAssignments, shiftSlots } from "@/db/schema/shifts";
import { BackfillService, type BackfillTrigger } from "./backfill.service";

interface VacancyCandidate {
  sourceAssignmentId: string;
  trigger: Exclude<BackfillTrigger, "MANUAL">;
}

export class BackfillVacancyScanner {
  private readonly service = new BackfillService();

  async findUnhandled(shiftId?: string): Promise<VacancyCandidate[]> {
    const noShowRows = await db
      .select({
        sourceAssignmentId: shiftAssignments.id,
      })
      .from(noShowEvents)
      .innerJoin(
        shiftAssignments,
        eq(shiftAssignments.id, noShowEvents.assignmentId)
      )
      .innerJoin(shiftSlots, eq(shiftSlots.id, shiftAssignments.shiftSlotId))
      .leftJoin(
        backfillRequests,
        eq(backfillRequests.sourceAssignmentId, shiftAssignments.id)
      )
      .where(
        and(
          eq(noShowEvents.status, "FINAL"),
          eq(shiftAssignments.state, "NO_SHOW"),
          eq(shiftSlots.status, "OPEN"),
          isNull(backfillRequests.id),
          shiftId ? eq(shiftAssignments.shiftId, shiftId) : undefined
        )
      );

    const cancellationRows = await db
      .select({
        sourceAssignmentId: shiftAssignments.id,
        cancelledBySide: cancellations.cancelledBySide,
      })
      .from(cancellations)
      .innerJoin(
        shiftAssignments,
        eq(shiftAssignments.id, cancellations.assignmentId)
      )
      .innerJoin(shiftSlots, eq(shiftSlots.id, shiftAssignments.shiftSlotId))
      .leftJoin(
        backfillRequests,
        eq(backfillRequests.sourceAssignmentId, shiftAssignments.id)
      )
      .where(
        and(
          inArray(shiftAssignments.state, [
            "CANCELLED_BY_WORKER",
            "CANCELLED_BY_EMPLOYER",
          ]),
          eq(shiftSlots.status, "OPEN"),
          isNull(backfillRequests.id),
          shiftId ? eq(shiftAssignments.shiftId, shiftId) : undefined
        )
      );

    const candidates: VacancyCandidate[] = [
      ...noShowRows.map((row) => ({
        sourceAssignmentId: row.sourceAssignmentId,
        trigger: "NO_SHOW" as const,
      })),
      ...cancellationRows.map((row) => ({
        sourceAssignmentId: row.sourceAssignmentId,
        trigger:
          row.cancelledBySide === "EMPLOYER"
            ? ("EMPLOYER_CANCELLATION" as const)
            : ("WORKER_CANCELLATION" as const),
      })),
    ];

    const seen = new Set<string>();
    return candidates.filter((item) => {
      if (seen.has(item.sourceAssignmentId)) return false;
      seen.add(item.sourceAssignmentId);
      return true;
    });
  }

  async requestUnhandled(shiftId?: string) {
    const vacancies = await this.findUnhandled(shiftId);
    const requests: string[] = [];
    const errors: Array<{ assignmentId: string; message: string }> = [];

    for (const vacancy of vacancies) {
      try {
        const result = await this.service.requestForAssignment(vacancy);
        if (result.request) requests.push(result.request.id);
      } catch (error) {
        errors.push({
          assignmentId: vacancy.sourceAssignmentId,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return { scanned: vacancies.length, requests: Array.from(new Set(requests)), errors };
  }
}
