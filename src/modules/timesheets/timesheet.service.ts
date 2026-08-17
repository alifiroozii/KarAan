import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { timesheets } from "@/db/schema/attendance";
import { shiftAssignments } from "@/db/schema/shifts";
import { auditLogs } from "@/db/schema/system";
import type { UserRole } from "@/modules/auth/auth.service";
import { TimesheetEngineService, type TimesheetListFilters } from "./timesheet-engine.service";

/**
 * Public Timesheet domain service.
 *
 * Attendance owns presence mutations only. The base engine owns worked-time,
 * breaks and overtime calculations. Assignment-level contractual bonuses
 * (such as urgent Backfill incentives) are applied here exactly once as a
 * separate contract source without mutating Wallet/Ledger state.
 */
export class TimesheetService extends TimesheetEngineService {
  private async syncAssignmentContractBonus(assignmentId: string, timesheetId: string) {
    let contractBonusRials = 0n;
    let finalPayRials = 0n;

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`timesheet:${assignmentId}`}))`
      );

      const [assignment] = await tx
        .select({ agreedBonusRials: shiftAssignments.agreedBonusRials })
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, assignmentId))
        .limit(1);
      const [timesheet] = await tx
        .select({
          calculatedPayRials: timesheets.calculatedPayRials,
          bonusRials: timesheets.bonusRials,
          deductionRials: timesheets.deductionRials,
          finalPayRials: timesheets.finalPayRials,
        })
        .from(timesheets)
        .where(and(eq(timesheets.id, timesheetId), eq(timesheets.assignmentId, assignmentId)))
        .limit(1);

      if (!assignment || !timesheet) return;

      contractBonusRials = assignment.agreedBonusRials;
      const rawFinal =
        timesheet.calculatedPayRials +
        timesheet.bonusRials +
        contractBonusRials -
        timesheet.deductionRials;
      finalPayRials = rawFinal < 0n ? 0n : rawFinal;

      if (timesheet.finalPayRials === finalPayRials) return;

      const updatedAt = new Date();
      await tx
        .update(timesheets)
        .set({ finalPayRials, updatedAt })
        .where(eq(timesheets.id, timesheetId));
      await tx
        .update(shiftAssignments)
        .set({ actualPayRials: finalPayRials, updatedAt })
        .where(eq(shiftAssignments.id, assignmentId));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: null,
        entityName: "timesheet",
        entityId: timesheetId,
        action: "TIMESHEET_CONTRACT_BONUS_SYNCED",
        details: {
          assignmentId,
          previousFinalPayRials: timesheet.finalPayRials.toString(),
          contractBonusRials: contractBonusRials.toString(),
          finalPayRials: finalPayRials.toString(),
          source: "SHIFT_ASSIGNMENT_AGREED_BONUS",
        },
      });
    });

    return { contractBonusRials, finalPayRials };
  }

  private async readContractBonus(assignmentId: string) {
    const [assignment] = await db
      .select({ agreedBonusRials: shiftAssignments.agreedBonusRials })
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    return assignment?.agreedBonusRials ?? 0n;
  }

  private async enrichContractBonus<T extends { assignmentId: string; bonusRials: string }>(detail: T) {
    const contractBonusRials = await this.readContractBonus(detail.assignmentId);
    const totalBonusRials = BigInt(detail.bonusRials) + contractBonusRials;
    return {
      ...detail,
      bonusRials: totalBonusRials.toString(),
      contractBonusRials: contractBonusRials.toString(),
      totalBonusRials: totalBonusRials.toString(),
    };
  }

  override async createOrGetForAssignment(assignmentId: string) {
    const detail = await super.createOrGetForAssignment(assignmentId);
    const synced = await this.syncAssignmentContractBonus(assignmentId, detail.id);
    return {
      ...(await this.enrichContractBonus(detail)),
      finalPayRials: synced.finalPayRials.toString(),
    };
  }

  override async recalculateForAssignment(assignmentId: string, actorUserId?: string) {
    const detail = await super.recalculateForAssignment(assignmentId, actorUserId);
    const synced = await this.syncAssignmentContractBonus(assignmentId, detail.id);
    return {
      ...(await this.enrichContractBonus(detail)),
      finalPayRials: synced.finalPayRials.toString(),
    };
  }

  override async getForActor(timesheetId: string, actorUserId: string, role: UserRole) {
    return this.enrichContractBonus(await super.getForActor(timesheetId, actorUserId, role));
  }

  override async listForWorker(workerUserId: string, filters: TimesheetListFilters = {}) {
    const page = await super.listForWorker(workerUserId, filters);
    return {
      ...page,
      items: await Promise.all(page.items.map((row) => this.enrichContractBonus(row))),
    };
  }

  override async listForEmployer(
    actorUserId: string,
    role: UserRole,
    filters: TimesheetListFilters = {}
  ) {
    const page = await super.listForEmployer(actorUserId, role, filters);
    return {
      ...page,
      items: await Promise.all(page.items.map((row) => this.enrichContractBonus(row))),
    };
  }
}
