import crypto from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, payouts, workerProfiles } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import { WalletLedgerService } from "@/modules/wallet/wallet-ledger.service";

const ledger = new WalletLedgerService();
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const IRAN_IBAN_PATTERN = /^IR\d{24}$/;
const MIN_PAYOUT_RIALS = 100_000n;

function scopeKey(userId: string, key: string): string {
  if (!IDEMPOTENCY_PATTERN.test(key)) {
    throw new AppError(
      "Idempotency-Key برداشت باید بین ۸ تا ۱۲۸ کاراکتر امن باشد.",
      "VALIDATION_ERROR",
      422
    );
  }
  return `payout:${userId}:${key}`;
}

function serializePayout(row: typeof payouts.$inferSelect, idempotent = false) {
  return {
    payoutId: row.id,
    walletId: row.walletId,
    amountRials: row.amountRials.toString(),
    bankIbanMasked: `${row.bankIban.slice(0, 4)}••••••••••••••••••${row.bankIban.slice(-4)}`,
    trackingNumber: row.trackingNumber,
    status: row.status,
    requestedAt: row.requestedAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    idempotent,
    bankTransferDeferred: row.status === "PENDING" || row.status === "PROCESSING",
  };
}

export class PayoutService {
  async requestPayout(input: {
    workerUserId: string;
    amountRials: bigint;
    idempotencyKey: string;
  }) {
    if (input.amountRials < MIN_PAYOUT_RIALS) {
      throw new AppError(
        `حداقل مبلغ برداشت ${MIN_PAYOUT_RIALS.toString()} ریال است.`,
        "VALIDATION_ERROR",
        422
      );
    }
    const idempotencyKey = scopeKey(input.workerUserId, input.idempotencyKey);

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`payout-request:${idempotencyKey}`}))`
      );

      const [worker] = await tx
        .select()
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, input.workerUserId))
        .limit(1);
      if (!worker) throw new AppError("پروفایل کارگر پیدا نشد.", "NOT_FOUND", 404);

      // Idempotent retries are resolved from the immutable request snapshot first.
      // A later IBAN/profile-status change must not turn a previously successful
      // network retry into a conflict or reserve the same money again.
      const [existing] = await tx
        .select()
        .from(payouts)
        .where(eq(payouts.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing) {
        if (
          existing.workerProfileId !== worker.id ||
          existing.amountRials !== input.amountRials
        ) {
          throw new AppError(
            "این Idempotency-Key قبلاً برای درخواست برداشت دیگری استفاده شده است.",
            "CONFLICT",
            409
          );
        }
        return { payout: existing, walletMutation: null, idempotent: true };
      }

      if (worker.verificationStatus !== "VERIFIED") {
        throw new AppError("برداشت فقط برای کارگر تاییدشده فعال است.", "FORBIDDEN", 403);
      }
      const iban = worker.bankIban?.replace(/\s+/g, "").toUpperCase() ?? "";
      if (!IRAN_IBAN_PATTERN.test(iban)) {
        throw new AppError(
          "شماره شبای معتبر IR برای برداشت ثبت نشده است.",
          "VALIDATION_ERROR",
          422
        );
      }

      const payoutId = `pyo_${crypto.randomUUID()}`;
      const walletMutation = await ledger.reservePayoutInTransaction(tx, {
        workerUserId: input.workerUserId,
        payoutId,
        amountRials: input.amountRials,
        idempotencyKey: `wallet:payout-reserve:${payoutId}`,
        metadata: { payoutId, bankIbanLast4: iban.slice(-4) },
      });
      const now = new Date();
      const [payout] = await tx
        .insert(payouts)
        .values({
          id: payoutId,
          walletId: walletMutation.walletId,
          workerProfileId: worker.id,
          idempotencyKey,
          amountRials: input.amountRials,
          bankIban: iban,
          ledgerTransactionId: walletMutation.transactionId,
          status: "PENDING",
          requestedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.workerUserId,
        entityName: "payout",
        entityId: payout.id,
        action: "PAYOUT_REQUESTED",
        details: {
          amountRials: input.amountRials.toString(),
          walletId: walletMutation.walletId,
          ledgerTransactionId: walletMutation.transactionId,
          bankIbanLast4: iban.slice(-4),
          bankTransferDeferred: true,
        },
      });
      return { payout, walletMutation, idempotent: false };
    });

    if (outcome.walletMutation) {
      publishRealtimeEvent("user", input.workerUserId, "wallet.updated", {
        walletId: outcome.walletMutation.walletId,
        userId: input.workerUserId,
        availableRials: outcome.walletMutation.availableRials.toString(),
        lockedEscrowRials: outcome.walletMutation.lockedEscrowRials.toString(),
        transactionId: outcome.walletMutation.transactionId,
        reason: "PAYOUT",
      });
    }
    return serializePayout(outcome.payout, outcome.idempotent);
  }

  async listForWorker(workerUserId: string) {
    const [worker] = await db
      .select({ id: workerProfiles.id })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, workerUserId))
      .limit(1);
    if (!worker) return [];
    const rows = await db
      .select()
      .from(payouts)
      .where(eq(payouts.workerProfileId, worker.id))
      .orderBy(desc(payouts.createdAt))
      .limit(50);
    return rows.map((row) => serializePayout(row));
  }
}
