import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  shiftEscrows,
  shifts,
  systemSettings,
  timesheets,
  shiftAssignments,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { WalletLedgerService } from "@/modules/wallet/wallet-ledger.service";
import type { UserRole } from "@/modules/auth/auth.service";
import {
  DEFAULT_EMPLOYER_FEE_BPS,
  DEFAULT_WORKER_COMMISSION_BPS,
  calculateBpsCeil,
} from "./settlement-policy";

type FinanceClient = Pick<typeof db, "select" | "insert" | "update" | "execute">;
type ShiftEscrowRow = typeof shiftEscrows.$inferSelect;
type ShiftRow = typeof shifts.$inferSelect;

const ledger = new WalletLedgerService();
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export interface PublishedShiftInput {
  employerUserId: string;
  idempotencyKey: string;
  title: string;
  description?: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  requiredSkills: string[];
  hourlyPayRials: bigint;
  totalBudgetRials: bigint;
  startAt: Date;
  endAt: Date;
}

function readBpsValue(value: unknown, fallback: number): number {
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

async function readPolicy(client: FinanceClient) {
  const [feeSetting] = await client
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, "settlement.employer_fee_bps"))
    .limit(1);
  const [workerSetting] = await client
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, "settlement.worker_commission_bps"))
    .limit(1);
  return {
    employerFeeBps: readBpsValue(feeSetting?.value, DEFAULT_EMPLOYER_FEE_BPS),
    workerCommissionBps: readBpsValue(
      workerSetting?.value,
      DEFAULT_WORKER_COMMISSION_BPS
    ),
  };
}

function scopeShiftIdempotency(userId: string, key: string): string {
  if (!IDEMPOTENCY_PATTERN.test(key)) {
    throw new AppError(
      "Idempotency-Key شیفت باید بین ۸ تا ۱۲۸ کاراکتر امن باشد.",
      "VALIDATION_ERROR",
      422
    );
  }
  return `escrow:shift:${userId}:${key}`;
}

function sameShiftRequest(shift: ShiftRow, input: PublishedShiftInput): boolean {
  return (
    shift.employerId === input.employerUserId &&
    shift.title === input.title &&
    (shift.description ?? null) === (input.description ?? null) &&
    shift.locationName === input.locationName &&
    shift.latitude === input.latitude &&
    shift.longitude === input.longitude &&
    shift.geofenceRadiusMeters === input.geofenceRadiusMeters &&
    JSON.stringify(shift.requiredSkills) === JSON.stringify(input.requiredSkills) &&
    shift.hourlyPayRials === input.hourlyPayRials &&
    shift.totalBudgetRials === input.totalBudgetRials &&
    shift.startAt.getTime() === input.startAt.getTime() &&
    shift.endAt.getTime() === input.endAt.getTime()
  );
}

function serializeEscrow(row: ShiftEscrowRow) {
  return {
    escrowId: row.id,
    shiftId: row.shiftId,
    employerUserId: row.employerUserId,
    walletId: row.walletId,
    employerFeeBps: row.employerFeeBps,
    workerCommissionBps: row.workerCommissionBps,
    workerBudgetReservedRials: row.workerBudgetReservedRials.toString(),
    feeReservedRials: row.feeReservedRials.toString(),
    totalReservedRials: row.totalReservedRials.toString(),
    remainingRials: row.remainingRials.toString(),
    settledWorkerRials: row.settledWorkerRials.toString(),
    settledFeeRials: row.settledFeeRials.toString(),
    releasedRials: row.releasedRials.toString(),
    status: row.status,
    fundedAt: row.fundedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class EscrowService {
  async createPublishedShiftWithEscrow(input: PublishedShiftInput) {
    if (input.hourlyPayRials <= 0n || input.totalBudgetRials <= 0n) {
      throw new AppError("مبلغ دستمزد و بودجه شیفت باید مثبت باشد.", "VALIDATION_ERROR", 422);
    }
    if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
      throw new AppError("مختصات شیفت معتبر نیست.", "VALIDATION_ERROR", 422);
    }
    if (input.endAt <= input.startAt) {
      throw new AppError("زمان پایان شیفت باید بعد از شروع باشد.", "VALIDATION_ERROR", 422);
    }

    const scopedKey = scopeShiftIdempotency(input.employerUserId, input.idempotencyKey);
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`shift-create:${scopedKey}`}))`
      );

      const [existingEscrow] = await tx
        .select()
        .from(shiftEscrows)
        .where(eq(shiftEscrows.idempotencyKey, scopedKey))
        .limit(1);
      if (existingEscrow) {
        const [existingShift] = await tx
          .select()
          .from(shifts)
          .where(eq(shifts.id, existingEscrow.shiftId))
          .limit(1);
        if (!existingShift || !sameShiftRequest(existingShift, input)) {
          throw new AppError(
            "این Idempotency-Key قبلاً برای شیفت دیگری استفاده شده است.",
            "CONFLICT",
            409
          );
        }
        return {
          created: false as const,
          shift: existingShift,
          escrow: existingEscrow,
          walletMutation: null,
        };
      }

      const policy = await readPolicy(tx);
      const feeReservedRials = calculateBpsCeil(input.totalBudgetRials, policy.employerFeeBps);
      const totalReservedRials = input.totalBudgetRials + feeReservedRials;
      const shiftId = `shf_${crypto.randomUUID()}`;
      const now = new Date();

      const [shift] = await tx
        .insert(shifts)
        .values({
          id: shiftId,
          employerId: input.employerUserId,
          title: input.title,
          description: input.description ?? null,
          locationName: input.locationName,
          latitude: input.latitude,
          longitude: input.longitude,
          geofenceRadiusMeters: input.geofenceRadiusMeters,
          requiredSkills: input.requiredSkills,
          hourlyPayRials: input.hourlyPayRials,
          totalBudgetRials: input.totalBudgetRials,
          startAt: input.startAt,
          endAt: input.endAt,
          status: "PUBLISHED",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const walletMutation = await ledger.reserveEscrowInTransaction(tx, {
        userId: input.employerUserId,
        shiftId,
        amountRials: totalReservedRials,
        idempotencyBase: `escrow:${shiftId}:initial`,
        metadata: {
          shiftId,
          workerBudgetRials: input.totalBudgetRials.toString(),
          employerFeeBps: policy.employerFeeBps,
          employerFeeReservedRials: feeReservedRials.toString(),
        },
      });

      const [escrow] = await tx
        .insert(shiftEscrows)
        .values({
          id: `esc_${crypto.randomUUID()}`,
          shiftId,
          employerUserId: input.employerUserId,
          walletId: walletMutation.walletId,
          idempotencyKey: scopedKey,
          employerFeeBps: policy.employerFeeBps,
          workerCommissionBps: policy.workerCommissionBps,
          workerBudgetReservedRials: input.totalBudgetRials,
          feeReservedRials,
          totalReservedRials,
          remainingRials: totalReservedRials,
          status: "ACTIVE",
          fundedAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.employerUserId,
        entityName: "shift_escrow",
        entityId: escrow.id,
        action: "SHIFT_ESCROW_FUNDED",
        details: {
          shiftId,
          workerBudgetRials: input.totalBudgetRials.toString(),
          feeReservedRials: feeReservedRials.toString(),
          totalReservedRials: totalReservedRials.toString(),
          employerFeeBps: policy.employerFeeBps,
          workerCommissionBps: policy.workerCommissionBps,
          availableDebitTransactionId: walletMutation.availableDebitTransactionId,
          escrowCreditTransactionId: walletMutation.escrowCreditTransactionId,
        },
      });

      return { created: true as const, shift, escrow, walletMutation };
    });

    if (outcome.walletMutation) {
      publishRealtimeEvent("user", input.employerUserId, "wallet.updated", {
        walletId: outcome.walletMutation.walletId,
        userId: input.employerUserId,
        availableRials: outcome.walletMutation.availableRials.toString(),
        lockedEscrowRials: outcome.walletMutation.lockedEscrowRials.toString(),
        transactionId: outcome.walletMutation.escrowCreditTransactionId,
        reason: "ESCROW",
      });
    }
    if (outcome.created) {
      publishRealtimeEvent("user", input.employerUserId, "shift.published", {
        shiftId: outcome.shift.id,
        publishedAt: outcome.shift.createdAt.toISOString(),
      });
    }

    return {
      created: outcome.created,
      shiftId: outcome.shift.id,
      status: outcome.shift.status,
      escrow: serializeEscrow(outcome.escrow),
    };
  }

  async ensureSettlementCoverageInTransaction(
    client: FinanceClient,
    input: {
      shift: ShiftRow;
      workerGrossRials: bigint;
      employerFeeRials: bigint;
      referenceId: string;
      policy?: { employerFeeBps: number; workerCommissionBps: number };
    }
  ): Promise<{ escrow: ShiftEscrowRow; topupTransactionId: string | null }> {
    const requiredRials = input.workerGrossRials + input.employerFeeRials;
    if (requiredRials <= 0n) {
      throw new AppError("مبلغ مورد نیاز تسویه معتبر نیست.", "VALIDATION_ERROR", 422);
    }

    await client.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`shift-escrow:${input.shift.id}`}))`
    );
    let [escrow] = await client
      .select()
      .from(shiftEscrows)
      .where(eq(shiftEscrows.shiftId, input.shift.id))
      .limit(1);

    if (!escrow) {
      const policy = input.policy ?? (await readPolicy(client));
      const walletMutation = await ledger.reserveEscrowInTransaction(client, {
        userId: input.shift.employerId,
        shiftId: input.shift.id,
        amountRials: requiredRials,
        idempotencyBase: `escrow:${input.shift.id}:legacy:${input.referenceId}`,
        metadata: { source: "LEGACY_SHIFT_SETTLEMENT_COVERAGE", referenceId: input.referenceId },
      });
      const now = new Date();
      [escrow] = await client
        .insert(shiftEscrows)
        .values({
          id: `esc_${crypto.randomUUID()}`,
          shiftId: input.shift.id,
          employerUserId: input.shift.employerId,
          walletId: walletMutation.walletId,
          idempotencyKey: `escrow:legacy:${input.shift.id}`,
          employerFeeBps: policy.employerFeeBps,
          workerCommissionBps: policy.workerCommissionBps,
          workerBudgetReservedRials: input.workerGrossRials,
          feeReservedRials: input.employerFeeRials,
          totalReservedRials: requiredRials,
          remainingRials: requiredRials,
          status: "ACTIVE",
          fundedAt: now,
          updatedAt: now,
        })
        .returning();
      return { escrow, topupTransactionId: walletMutation.escrowCreditTransactionId };
    }

    if (escrow.employerUserId !== input.shift.employerId) {
      throw new AppError("مالک Escrow با مالک شیفت تطابق ندارد.", "CONFLICT", 409);
    }
    if (escrow.status === "RELEASED") {
      throw new AppError("سپرده این شیفت قبلاً آزاد شده است.", "CONFLICT", 409);
    }
    if (escrow.remainingRials >= requiredRials) {
      return { escrow, topupTransactionId: null };
    }

    const shortfall = requiredRials - escrow.remainingRials;
    const walletMutation = await ledger.reserveEscrowInTransaction(client, {
      userId: input.shift.employerId,
      shiftId: input.shift.id,
      amountRials: shortfall,
      idempotencyBase: `escrow:${escrow.id}:coverage:${input.referenceId}`,
      metadata: {
        source: "SETTLEMENT_SHORTFALL",
        referenceId: input.referenceId,
        shortfallRials: shortfall.toString(),
      },
    });
    const now = new Date();
    const [updated] = await client
      .update(shiftEscrows)
      .set({
        totalReservedRials: sql`${shiftEscrows.totalReservedRials} + ${shortfall}`,
        remainingRials: sql`${shiftEscrows.remainingRials} + ${shortfall}`,
        status: "ACTIVE",
        updatedAt: now,
      })
      .where(eq(shiftEscrows.id, escrow.id))
      .returning();
    return { escrow: updated, topupTransactionId: walletMutation.escrowCreditTransactionId };
  }

  async getForShift(shiftId: string, actorUserId: string, role: UserRole) {
    const [row] = await db
      .select({ escrow: shiftEscrows, shift: shifts })
      .from(shiftEscrows)
      .innerJoin(shifts, eq(shifts.id, shiftEscrows.shiftId))
      .where(eq(shiftEscrows.shiftId, shiftId))
      .limit(1);
    if (!row) throw new AppError("سپرده شیفت پیدا نشد.", "NOT_FOUND", 404);
    const privileged = role === "FINANCE_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
    if (!privileged && row.shift.employerId !== actorUserId) {
      throw new AppError("دسترسی به سپرده این شیفت مجاز نیست.", "FORBIDDEN", 403);
    }
    return serializeEscrow(row.escrow);
  }

  async releaseRemaining(shiftId: string, actorUserId: string, role: UserRole) {
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`shift-escrow-release:${shiftId}`}))`
      );
      const [row] = await tx
        .select({ escrow: shiftEscrows, shift: shifts })
        .from(shiftEscrows)
        .innerJoin(shifts, eq(shifts.id, shiftEscrows.shiftId))
        .where(eq(shiftEscrows.shiftId, shiftId))
        .limit(1);
      if (!row) throw new AppError("سپرده شیفت پیدا نشد.", "NOT_FOUND", 404);
      const privileged = role === "FINANCE_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
      if (!privileged && row.shift.employerId !== actorUserId) {
        throw new AppError("آزادسازی این سپرده مجاز نیست.", "FORBIDDEN", 403);
      }
      if (row.escrow.status === "RELEASED" || row.escrow.remainingRials === 0n) {
        return { escrow: row.escrow, walletMutation: null, idempotent: true };
      }
      if (row.shift.status !== "CANCELLED" && row.shift.status !== "COMPLETED") {
        throw new AppError(
          "سپرده فقط پس از CANCELLED یا COMPLETED شدن شیفت قابل آزادسازی است.",
          "CONFLICT",
          409,
          { shiftId, shiftStatus: row.shift.status }
        );
      }

      const assignmentRows = await tx
        .select({
          assignmentState: shiftAssignments.state,
          timesheetStatus: timesheets.status,
        })
        .from(shiftAssignments)
        .leftJoin(timesheets, eq(timesheets.assignmentId, shiftAssignments.id))
        .where(eq(shiftAssignments.shiftId, shiftId));

      const terminalWithoutPay = new Set<string>([
        "DECLINED",
        "CANCELLED_BY_WORKER",
        "CANCELLED_BY_EMPLOYER",
        "NO_SHOW",
        "REPLACED",
        "REMOVED",
      ]);
      const blocked = assignmentRows.some((item) => {
        if (terminalWithoutPay.has(item.assignmentState)) return false;
        return item.timesheetStatus !== "SETTLED" && item.timesheetStatus !== "VOID";
      });
      if (blocked) {
        throw new AppError(
          "تا زمانی که همه انتصاب‌های قابل پرداخت تسویه یا مختومه نشده‌اند، سپرده قابل آزادسازی نیست.",
          "CONFLICT",
          409
        );
      }

      const amount = row.escrow.remainingRials;
      const walletMutation = await ledger.releaseEscrowInTransaction(tx, {
        walletId: row.escrow.walletId,
        shiftId,
        amountRials: amount,
        idempotencyBase: `escrow:${row.escrow.id}:release-final`,
        metadata: { shiftId, releasedBy: actorUserId },
      });
      const now = new Date();
      const [escrow] = await tx
        .update(shiftEscrows)
        .set({
          remainingRials: 0n,
          releasedRials: sql`${shiftEscrows.releasedRials} + ${amount}`,
          status: "RELEASED",
          updatedAt: now,
        })
        .where(eq(shiftEscrows.id, row.escrow.id))
        .returning();
      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "shift_escrow",
        entityId: escrow.id,
        action: "SHIFT_ESCROW_RELEASED",
        details: {
          shiftId,
          shiftStatus: row.shift.status,
          releasedRials: amount.toString(),
          escrowDebitTransactionId: walletMutation.escrowDebitTransactionId,
          availableCreditTransactionId: walletMutation.availableCreditTransactionId,
        },
      });
      return { escrow, walletMutation, idempotent: false };
    });

    if (outcome.walletMutation) {
      publishRealtimeEvent("user", outcome.escrow.employerUserId, "wallet.updated", {
        walletId: outcome.walletMutation.walletId,
        userId: outcome.escrow.employerUserId,
        availableRials: outcome.walletMutation.availableRials.toString(),
        lockedEscrowRials: outcome.walletMutation.lockedEscrowRials.toString(),
        transactionId: outcome.walletMutation.availableCreditTransactionId,
        reason: "REFUND",
      });
    }
    return { ...serializeEscrow(outcome.escrow), idempotent: outcome.idempotent };
  }
}
