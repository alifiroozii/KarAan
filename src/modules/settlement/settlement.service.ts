import { db } from "@/db";
import { timesheets } from "@/db/schema/attendance";
import { shifts, shiftAssignments } from "@/db/schema/shifts";
import { wallets, walletTransactions } from "@/db/schema/finance";
import { workerProfiles } from "@/db/schema/workers";
import { eq, sql } from "drizzle-orm";
import { assertOwnership } from "@/modules/auth/permissions";
import { AppError } from "@/lib/errors";

export class SettlementService {
  /**
   * Employer Timesheet Approval & Ledger Wallet Settlement
   */
  async approveTimesheet(timesheetId: string, employerUserId: string) {
    const [timesheet] = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (!timesheet) {
      throw new AppError("تایم‌شیت کارکرد پیدا نشد.", "NOT_FOUND", 404);
    }

    const [assignment] = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, timesheet.assignmentId))
      .limit(1);

    if (!assignment) {
      throw new AppError("انتصاب مرتبط با تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);
    }

    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, assignment.shiftId))
      .limit(1);

    if (!shift) {
      throw new AppError("شیفت مربوطه پیدا نشد.", "NOT_FOUND", 404);
    }

    // Ownership check (Employer A cannot approve Employer B's timesheet)
    assertOwnership(employerUserId, shift.employerId);

    if (timesheet.status === "APPROVED") {
      throw new AppError("این تایم‌شیت قبلاً تایید و تسویه شده است.", "CONFLICT", 400);
    }

    const amountRials = timesheet.finalPayRials || timesheet.calculatedPayRials;

    // 1. Update Timesheet Status to APPROVED
    await db
      .update(timesheets)
      .set({
        status: "APPROVED",
        approvedByUserId: employerUserId,
        approvedAt: new Date(),
      })
      .where(eq(timesheets.id, timesheet.id));

    // 2. Fetch or Create Worker Wallet
    let [workerWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, assignment.workerId))
      .limit(1);

    if (!workerWallet) {
      const walletId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(wallets).values({
        id: walletId,
        userId: assignment.workerId,
        availableRials: BigInt(0),
        lockedEscrowRials: BigInt(0),
      });
      [workerWallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, assignment.workerId))
        .limit(1);
    }

    const newBalance = workerWallet.availableRials + amountRials;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `idem_${timesheet.id}_${Date.now()}`;

    // 3. Record Earnings Transaction for Worker Wallet
    await db.insert(walletTransactions).values({
      id: txId,
      walletId: workerWallet.id,
      idempotencyKey,
      amountRials,
      direction: "CREDIT",
      referenceType: "SETTLEMENT",
      referenceId: shift.id,
      balanceAfterRials: newBalance,
      status: "SUCCESS",
    });

    // 4. Update Worker Wallet Balance
    await db
      .update(wallets)
      .set({
        availableRials: sql`${wallets.availableRials} + ${amountRials}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, workerWallet.id));

    // 5. Update Worker Profile Completed Shifts Count
    await db
      .update(workerProfiles)
      .set({
        completedShiftsCount: sql`${workerProfiles.completedShiftsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workerProfiles.userId, assignment.workerId));

    return {
      timesheetId: timesheet.id,
      status: "APPROVED",
      settledAmountRials: amountRials,
      workerId: assignment.workerId,
    };
  }
}
