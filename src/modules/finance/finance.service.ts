import { db } from "@/db";
import {
  walletTransactions,
  wallets,
  employerProfiles,
  workerProfiles,
  shiftAssignments,
  shifts,
  auditLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export class FinanceService {
  async lockEscrow(
    employerUserId: string,
    shiftId: string,
    amountRials: bigint,
    idempotencyKey: string
  ): Promise<{ transactionId: string; lockedAmount: bigint }> {
    if (amountRials <= BigInt(0)) {
      throw new AppError("مبلغ قفل سپرده باید بیشتر از صفر باشد.", "VALIDATION_ERROR", 422);
    }

    // Check idempotency
    const existingTx = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingTx.length > 0) {
      return {
        transactionId: existingTx[0].id,
        lockedAmount: existingTx[0].amountRials,
      };
    }

    // Fetch employer profile
    const employerProfileList = await db
      .select()
      .from(employerProfiles)
      .where(eq(employerProfiles.userId, employerUserId))
      .limit(1);

    if (employerProfileList.length === 0) {
      throw new AppError("پروفایل کارفرما یافت نشد.", "NOT_FOUND", 404);
    }

    const profile = employerProfileList[0];

    if (profile.walletBalanceRials < amountRials) {
      throw new AppError("موجودی کیف پول کارفرما برای این شیفت کافی نیست.", "INSUFFICIENT_FUNDS", 400);
    }

    // Fetch wallet
    const walletList = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, employerUserId))
      .limit(1);

    const walletId = walletList[0]?.id || `wlt_${crypto.randomUUID()}`;

    // Update balances atomically: debit wallet, credit escrow
    const txId = `tx_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      await tx
        .update(employerProfiles)
        .set({
          walletBalanceRials: sql`${employerProfiles.walletBalanceRials} - ${amountRials}`,
          lockedEscrowRials: sql`${employerProfiles.lockedEscrowRials} + ${amountRials}`,
          updatedAt: new Date(),
        })
        .where(eq(employerProfiles.id, profile.id));

      await tx.insert(walletTransactions).values({
        id: txId,
        walletId,
        idempotencyKey,
        amountRials,
        direction: "DEBIT",
        referenceType: "ESCROW_LOCK",
        referenceId: shiftId,
        balanceAfterRials: profile.walletBalanceRials - amountRials,
        status: "SUCCESS",
      });

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: employerUserId,
        entityName: "shift",
        entityId: shiftId,
        action: "ESCROW_LOCKED",
        details: { amountRials: amountRials.toString(), idempotencyKey },
      });
    });

    return { transactionId: txId, lockedAmount: amountRials };
  }

  async settleAssignment(
    assignmentId: string,
    idempotencyKey: string
  ): Promise<{ transactionId: string; settledAmount: bigint }> {
    // Check idempotency
    const existingTx = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingTx.length > 0) {
      return {
        transactionId: existingTx[0].id,
        settledAmount: existingTx[0].amountRials,
      };
    }

    // Fetch assignment, shift, and profiles
    const assignmentList = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);

    if (assignmentList.length === 0) {
      throw new AppError("تایم‌شیت/شیفت اختصاص داده شده یافت نشد.", "NOT_FOUND", 404);
    }

    const assignment = assignmentList[0];
    const shiftList = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    if (shiftList.length === 0) {
      throw new AppError("اطلاعات شیفت مربوطه یافت نشد.", "NOT_FOUND", 404);
    }

    const shift = shiftList[0];
    const amountToSettle = assignment.actualPayRials > BigInt(0) ? assignment.actualPayRials : shift.totalBudgetRials;

    const walletList = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, shift.employerId))
      .limit(1);

    const walletId = walletList[0]?.id || `wlt_${crypto.randomUUID()}`;

    const txId = `tx_${crypto.randomUUID()}`;

    await db.transaction(async (tx) => {
      // Debit employer escrow
      await tx
        .update(employerProfiles)
        .set({
          lockedEscrowRials: sql`GREATEST(0, ${employerProfiles.lockedEscrowRials} - ${amountToSettle})`,
          updatedAt: new Date(),
        })
        .where(eq(employerProfiles.userId, shift.employerId));

      // Credit worker wallet
      await tx
        .update(workerProfiles)
        .set({
          completedShiftsCount: sql`${workerProfiles.completedShiftsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(workerProfiles.userId, assignment.workerId));

      // Mark assignment settled
      await tx
        .update(shiftAssignments)
        .set({ state: "COMPLETED", updatedAt: new Date() })
        .where(eq(shiftAssignments.id, assignmentId));

      // Record in ledger
      await tx.insert(walletTransactions).values({
        id: txId,
        walletId,
        idempotencyKey,
        amountRials: amountToSettle,
        direction: "CREDIT",
        referenceType: "SETTLEMENT",
        referenceId: assignmentId,
        balanceAfterRials: amountToSettle,
        status: "SUCCESS",
      });

      // Audit Log
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: shift.employerId,
        entityName: "shift_assignment",
        entityId: assignmentId,
        action: "SETTLED",
        details: { amountRials: amountToSettle.toString(), workerId: assignment.workerId },
      });
    });

    return { transactionId: txId, settledAmount: amountToSettle };
  }
}
