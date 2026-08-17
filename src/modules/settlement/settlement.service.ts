import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  settlements,
  shiftAssignments,
  shiftEscrows,
  shifts,
  systemSettings,
  timesheets,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";
import { AssignmentStateMachine } from "@/modules/assignments/assignment.state-machine";
import { WalletLedgerService } from "@/modules/wallet/wallet-ledger.service";
import { EscrowService } from "./escrow.service";
import {
  DEFAULT_EMPLOYER_FEE_BPS,
  DEFAULT_WORKER_COMMISSION_BPS,
  calculateSettlementAmounts,
} from "./settlement-policy";

const ledger = new WalletLedgerService();
const escrowService = new EscrowService();

type SettlementRow = typeof settlements.$inferSelect;

function serializeSettlement(row: SettlementRow, idempotent = false) {
  return {
    settlementId: row.id,
    timesheetId: row.timesheetId,
    assignmentId: row.assignmentId,
    shiftEscrowId: row.shiftEscrowId,
    employerWalletId: row.employerWalletId,
    workerWalletId: row.workerWalletId,
    workerGrossRials: row.workerGrossRials.toString(),
    workerCommissionBps: row.workerCommissionBps,
    workerCommissionRials: row.workerCommissionRials.toString(),
    workerNetRials: row.workerNetRials.toString(),
    employerFeeBps: row.employerFeeBps,
    employerFeeRials: row.employerFeeRials.toString(),
    totalEscrowDebitRials: row.totalEscrowDebitRials.toString(),
    status: row.status,
    settledAt: row.settledAt.toISOString(),
    idempotent,
  };
}

function readBps(value: unknown, fallback: number): number {
  const candidate =
    typeof value === "number"
      ? value
      : value && typeof value === "object" && "bps" in value
        ? Number((value as Record<string, unknown>).bps)
        : fallback;
  return Number.isInteger(candidate) && candidate >= 0 && candidate <= 10_000
    ? candidate
    : fallback;
}

async function readCurrentPolicy() {
  const [fee] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, "settlement.employer_fee_bps"))
    .limit(1);
  const [commission] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, "settlement.worker_commission_bps"))
    .limit(1);
  return {
    employerFeeBps: readBps(fee?.value, DEFAULT_EMPLOYER_FEE_BPS),
    workerCommissionBps: readBps(
      commission?.value,
      DEFAULT_WORKER_COMMISSION_BPS
    ),
  };
}

function canSettle(role: UserRole, actorUserId: string, employerUserId: string): boolean {
  if (role === "FINANCE_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN") return true;
  return role === "EMPLOYER" && actorUserId === employerUserId;
}

export class SettlementService {
  async settleTimesheet(timesheetId: string, actorUserId: string, role: UserRole) {
    const currentPolicy = await readCurrentPolicy();

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`settlement:${timesheetId}`}))`
      );

      const [record] = await tx
        .select({ timesheet: timesheets, assignment: shiftAssignments, shift: shifts })
        .from(timesheets)
        .innerJoin(shiftAssignments, eq(shiftAssignments.id, timesheets.assignmentId))
        .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
        .where(eq(timesheets.id, timesheetId))
        .limit(1);
      if (!record) throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);
      if (!canSettle(role, actorUserId, record.shift.employerId)) {
        throw new AppError("مجوز تسویه این تایم‌شیت را ندارید.", "FORBIDDEN", 403);
      }

      const [existingSettlement] = await tx
        .select()
        .from(settlements)
        .where(eq(settlements.timesheetId, timesheetId))
        .limit(1);
      if (existingSettlement) {
        return {
          kind: "existing" as const,
          settlement: existingSettlement,
          employerWalletMutation: null,
          workerWalletMutation: null,
          assignmentChanged: false,
          shiftId: record.shift.id,
          workerId: record.assignment.workerId,
        };
      }

      if (record.timesheet.status === "SETTLED") {
        throw new AppError(
          "تایم‌شیت SETTLED است اما رکورد Settlement ندارد؛ نیاز به بررسی مالی دارد.",
          "CONFLICT",
          409
        );
      }
      if (record.timesheet.status !== "READY_FOR_SETTLEMENT") {
        throw new AppError(
          "فقط تایم‌شیت READY_FOR_SETTLEMENT قابل تسویه است.",
          "INVALID_STATE_TRANSITION",
          409,
          { status: record.timesheet.status }
        );
      }
      if (record.timesheet.finalPayRials <= 0n) {
        throw new AppError("مبلغ نهایی تایم‌شیت برای تسویه معتبر نیست.", "VALIDATION_ERROR", 422);
      }

      const [policyEscrow] = await tx
        .select()
        .from(shiftEscrows)
        .where(eq(shiftEscrows.shiftId, record.shift.id))
        .limit(1);
      const employerFeeBps = policyEscrow?.employerFeeBps ?? currentPolicy.employerFeeBps;
      const workerCommissionBps =
        policyEscrow?.workerCommissionBps ?? currentPolicy.workerCommissionBps;
      const amounts = calculateSettlementAmounts({
        workerGrossRials: record.timesheet.finalPayRials,
        employerFeeBps,
        workerCommissionBps,
      });
      if (amounts.workerNetRials <= 0n) {
        throw new AppError("خالص پرداختی کارگر باید بیشتر از صفر باشد.", "VALIDATION_ERROR", 422);
      }

      const coverage = await escrowService.ensureSettlementCoverageInTransaction(tx, {
        shift: record.shift,
        workerGrossRials: amounts.workerGrossRials,
        employerFeeRials: amounts.employerFeeRials,
        referenceId: timesheetId,
      });
      const escrow = coverage.escrow;
      const settlementId = `stl_${crypto.randomUUID()}`;
      const metadata = {
        settlementId,
        timesheetId,
        assignmentId: record.assignment.id,
        shiftId: record.shift.id,
        workerGrossRials: amounts.workerGrossRials.toString(),
        workerCommissionRials: amounts.workerCommissionRials.toString(),
        employerFeeRials: amounts.employerFeeRials.toString(),
      };

      const employerSettlement = await ledger.consumeEscrowInTransaction(tx, {
        walletId: escrow.walletId,
        amountRials: amounts.workerNetRials,
        referenceType: "SETTLEMENT",
        referenceId: timesheetId,
        idempotencyKey: `settlement:${timesheetId}:employer-worker-net`,
        description: "مصرف سپرده برای خالص درآمد کارگر",
        metadata,
      });

      const platformRevenueRials =
        amounts.employerFeeRials + amounts.workerCommissionRials;
      let employerFeeLedgerId: string | null = null;
      let employerFinalMutation = employerSettlement;
      if (platformRevenueRials > 0n) {
        const feeMutation = await ledger.consumeEscrowInTransaction(tx, {
          walletId: escrow.walletId,
          amountRials: platformRevenueRials,
          referenceType: "PLATFORM_FEE",
          referenceId: timesheetId,
          idempotencyKey: `settlement:${timesheetId}:platform-fee`,
          description: "کارمزد پلتفرم از سپرده شیفت",
          metadata,
        });
        employerFeeLedgerId = feeMutation.transactionId;
        employerFinalMutation = feeMutation;
      }

      const workerCredit = await ledger.creditWorkerSettlementInTransaction(tx, {
        workerUserId: record.assignment.workerId,
        timesheetId,
        amountRials: amounts.workerNetRials,
        idempotencyKey: `settlement:${timesheetId}:worker-credit`,
        metadata,
      });

      const now = new Date();
      const nextRemaining = escrow.remainingRials - amounts.totalEscrowDebitRials;
      if (nextRemaining < 0n) {
        throw new AppError("مانده Escrow برای تسویه کافی نیست.", "INSUFFICIENT_FUNDS", 409);
      }
      const [updatedEscrow] = await tx
        .update(shiftEscrows)
        .set({
          remainingRials: nextRemaining,
          settledWorkerRials: sql`${shiftEscrows.settledWorkerRials} + ${amounts.workerGrossRials}`,
          settledFeeRials: sql`${shiftEscrows.settledFeeRials} + ${platformRevenueRials}`,
          status: nextRemaining === 0n ? "SETTLED" : "PARTIALLY_SETTLED",
          updatedAt: now,
        })
        .where(eq(shiftEscrows.id, escrow.id))
        .returning();

      const [settlement] = await tx
        .insert(settlements)
        .values({
          id: settlementId,
          timesheetId,
          assignmentId: record.assignment.id,
          shiftEscrowId: updatedEscrow.id,
          employerWalletId: updatedEscrow.walletId,
          workerWalletId: workerCredit.walletId,
          workerGrossRials: amounts.workerGrossRials,
          workerCommissionBps,
          workerCommissionRials: amounts.workerCommissionRials,
          workerNetRials: amounts.workerNetRials,
          employerFeeBps,
          employerFeeRials: amounts.employerFeeRials,
          totalEscrowDebitRials: amounts.totalEscrowDebitRials,
          employerSettlementLedgerId: employerSettlement.transactionId,
          employerFeeLedgerId,
          workerCreditLedgerId: workerCredit.transactionId,
          status: "SETTLED",
          settledAt: now,
          createdAt: now,
        })
        .returning();

      await tx
        .update(timesheets)
        .set({ status: "SETTLED", updatedAt: now })
        .where(eq(timesheets.id, timesheetId));

      let assignmentChanged = false;
      if (record.assignment.state !== "COMPLETED") {
        AssignmentStateMachine.assertCanTransition(record.assignment.state, "COMPLETED");
        await tx
          .update(shiftAssignments)
          .set({ state: "COMPLETED", updatedAt: now })
          .where(eq(shiftAssignments.id, record.assignment.id));
        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: actorUserId,
          entityName: "shift_assignment",
          entityId: record.assignment.id,
          action: "ASSIGNMENT_STATE_TRANSITION",
          details: {
            from: record.assignment.state,
            to: "COMPLETED",
            reason: "TIMESHEET_SETTLED",
          },
        });
        assignmentChanged = true;
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "settlement",
        entityId: settlement.id,
        action: "TIMESHEET_SETTLED",
        details: {
          timesheetId,
          assignmentId: record.assignment.id,
          shiftId: record.shift.id,
          workerGrossRials: amounts.workerGrossRials.toString(),
          workerCommissionBps,
          workerCommissionRials: amounts.workerCommissionRials.toString(),
          workerNetRials: amounts.workerNetRials.toString(),
          employerFeeBps,
          employerFeeRials: amounts.employerFeeRials.toString(),
          totalEscrowDebitRials: amounts.totalEscrowDebitRials.toString(),
          escrowRemainingRials: nextRemaining.toString(),
          coverageTopupTransactionId: coverage.topupTransactionId,
          employerSettlementLedgerId: employerSettlement.transactionId,
          employerFeeLedgerId,
          workerCreditLedgerId: workerCredit.transactionId,
        },
      });

      return {
        kind: "settled" as const,
        settlement,
        employerWalletMutation: employerFinalMutation,
        workerWalletMutation: workerCredit,
        assignmentChanged,
        shiftId: record.shift.id,
        workerId: record.assignment.workerId,
      };
    });

    if (outcome.kind === "settled") {
      publishRealtimeEvent("user", outcome.settlement.employerWalletId, "wallet.updated", {
        walletId: outcome.employerWalletMutation.walletId,
        userId: actorUserId,
        availableRials: outcome.employerWalletMutation.availableRials.toString(),
        lockedEscrowRials: outcome.employerWalletMutation.lockedEscrowRials.toString(),
        transactionId: outcome.employerWalletMutation.transactionId,
        reason: "SETTLEMENT",
      });
      publishRealtimeEvent("user", outcome.workerId, "wallet.updated", {
        walletId: outcome.workerWalletMutation.walletId,
        userId: outcome.workerId,
        availableRials: outcome.workerWalletMutation.availableRials.toString(),
        lockedEscrowRials: outcome.workerWalletMutation.lockedEscrowRials.toString(),
        transactionId: outcome.workerWalletMutation.transactionId,
        reason: "SETTLEMENT",
      });
      const timesheetPayload = { timesheetId, status: "SETTLED" };
      publishRealtimeEvent("assignment", outcome.settlement.assignmentId, "timesheet.updated", timesheetPayload);
      publishRealtimeEvent("shift", outcome.shiftId, "timesheet.updated", timesheetPayload);
      publishRealtimeEvent("user", outcome.workerId, "timesheet.updated", timesheetPayload);
      if (outcome.assignmentChanged) {
        publishRealtimeEvent("assignment", outcome.settlement.assignmentId, "assignment.updated", {
          assignmentId: outcome.settlement.assignmentId,
          shiftId: outcome.shiftId,
          state: "COMPLETED",
        });
      }
    }

    return serializeSettlement(outcome.settlement, outcome.kind === "existing");
  }

  /** Compatibility name retained, but now routes to the real ledger-safe settlement. */
  async approveTimesheet(timesheetId: string, employerUserId: string) {
    return this.settleTimesheet(timesheetId, employerUserId, "EMPLOYER");
  }
}
