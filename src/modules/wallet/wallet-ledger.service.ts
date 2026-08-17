import crypto from "crypto";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  payments,
  wallets,
  walletTransactions,
} from "@/db/schema";
import { AppError } from "@/lib/errors";

type LedgerClient = Pick<typeof db, "select" | "insert" | "update" | "execute">;
type PaymentRow = typeof payments.$inferSelect;
type WalletRow = typeof wallets.$inferSelect;
type WalletTransactionRow = typeof walletTransactions.$inferSelect;
type WalletBucket = "AVAILABLE" | "LOCKED_ESCROW";
type LedgerDirection = "CREDIT" | "DEBIT";
type LedgerReferenceType =
  | "ESCROW_LOCK"
  | "ESCROW_RELEASE"
  | "SETTLEMENT"
  | "PLATFORM_FEE"
  | "REFUND"
  | "TOPUP"
  | "WITHDRAWAL"
  | "PENALTY";

const MAX_PAGE_SIZE = 100;
const PAYMENT_CREDIT_PREFIX = "wallet:payment-credit:";

export interface WalletCreditResult {
  walletId: string;
  transactionId: string;
  availableRials: bigint;
  lockedEscrowRials: bigint;
  idempotent: boolean;
}

export interface WalletSummary {
  walletId: string;
  userId: string;
  availableRials: bigint;
  lockedEscrowRials: bigint;
  currency: "RIAL";
  updatedAt: Date;
}

export interface WalletTransactionView {
  transactionId: string;
  amountRials: bigint;
  direction: LedgerDirection;
  bucket: WalletBucket;
  referenceType: LedgerReferenceType;
  referenceId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  balanceAfterRials: bigint;
  createdAt: Date;
}

export interface LedgerMutationResult {
  walletId: string;
  transactionId: string;
  amountRials: bigint;
  direction: LedgerDirection;
  bucket: WalletBucket;
  availableRials: bigint;
  lockedEscrowRials: bigint;
  balanceAfterRials: bigint;
  idempotent: boolean;
}

function transactionToView(row: WalletTransactionRow): WalletTransactionView {
  return {
    transactionId: row.id,
    amountRials: row.amountRials,
    direction: row.direction,
    bucket: row.bucket,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    description: row.description,
    metadata: row.metadata,
    balanceAfterRials: row.balanceAfterRials,
    createdAt: row.createdAt,
  };
}

function summaryFromWallet(row: WalletRow): WalletSummary {
  return {
    walletId: row.id,
    userId: row.userId,
    availableRials: row.availableRials,
    lockedEscrowRials: row.lockedEscrowRials,
    currency: row.currency,
    updatedAt: row.updatedAt,
  };
}

function assertTopupPayment(payment: PaymentRow): void {
  if (payment.status !== "SUCCESS" || !payment.verifiedAt) {
    throw new AppError(
      "فقط پرداخت تاییدشده قابل ثبت در کیف پول است.",
      "INVALID_STATE_TRANSITION",
      409,
      { paymentId: payment.id, paymentStatus: payment.status }
    );
  }
  if (payment.purpose !== "WALLET_TOPUP") {
    throw new AppError(
      "این پرداخت برای شارژ کیف پول ایجاد نشده است.",
      "INVALID_STATE_TRANSITION",
      409,
      { paymentId: payment.id, purpose: payment.purpose }
    );
  }
  if (payment.amountRials <= 0n) {
    throw new AppError("مبلغ پرداخت معتبر نیست.", "VALIDATION_ERROR", 422);
  }
}

async function getOrCreateWallet(client: LedgerClient, userId: string): Promise<WalletRow> {
  await client.execute(sql`select pg_advisory_xact_lock(hashtext(${`wallet-owner:${userId}`}))`);

  const [existing] = await client
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);
  if (existing) return existing;

  const now = new Date();
  const [created] = await client
    .insert(wallets)
    .values({
      id: `wlt_${crypto.randomUUID()}`,
      userId,
      availableRials: 0n,
      lockedEscrowRials: 0n,
      currency: "RIAL",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return created;
}

async function readLockedWallet(client: LedgerClient, walletId: string): Promise<WalletRow> {
  await client.execute(sql`select "id" from "wallets" where "id" = ${walletId} for update`);
  const [wallet] = await client
    .select()
    .from(wallets)
    .where(eq(wallets.id, walletId))
    .limit(1);
  if (!wallet) throw new AppError("کیف پول پیدا نشد.", "NOT_FOUND", 404);
  return wallet;
}

function bucketBalance(wallet: WalletRow, bucket: WalletBucket): bigint {
  return bucket === "AVAILABLE" ? wallet.availableRials : wallet.lockedEscrowRials;
}

function validateExistingEntry(
  row: WalletTransactionRow,
  input: {
    walletId: string;
    amountRials: bigint;
    direction: LedgerDirection;
    bucket: WalletBucket;
    referenceType: LedgerReferenceType;
    referenceId?: string | null;
  }
): void {
  const valid =
    row.walletId === input.walletId &&
    row.amountRials === input.amountRials &&
    row.direction === input.direction &&
    row.bucket === input.bucket &&
    row.referenceType === input.referenceType &&
    row.referenceId === (input.referenceId ?? null) &&
    row.status === "SUCCESS";
  if (!valid) {
    throw new AppError(
      "تعارض در idempotency دفتر کل کیف پول شناسایی شد.",
      "CONFLICT",
      409,
      { transactionId: row.id, idempotencyKey: row.idempotencyKey }
    );
  }
}

export class WalletLedgerService {
  async getOrCreateWalletInTransaction(client: LedgerClient, userId: string): Promise<WalletRow> {
    return getOrCreateWallet(client, userId);
  }

  async postEntryInTransaction(
    client: LedgerClient,
    input: {
      walletId: string;
      idempotencyKey: string;
      amountRials: bigint;
      direction: LedgerDirection;
      bucket: WalletBucket;
      referenceType: LedgerReferenceType;
      referenceId?: string | null;
      description: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<LedgerMutationResult> {
    if (input.amountRials <= 0n) {
      throw new AppError("مبلغ تراکنش دفتر کل باید بیشتر از صفر باشد.", "VALIDATION_ERROR", 422);
    }

    const [existing] = await client
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) {
      validateExistingEntry(existing, input);
      const wallet = await readLockedWallet(client, input.walletId);
      return {
        walletId: wallet.id,
        transactionId: existing.id,
        amountRials: existing.amountRials,
        direction: existing.direction,
        bucket: existing.bucket,
        availableRials: wallet.availableRials,
        lockedEscrowRials: wallet.lockedEscrowRials,
        balanceAfterRials: existing.balanceAfterRials,
        idempotent: true,
      };
    }

    const wallet = await readLockedWallet(client, input.walletId);
    const current = bucketBalance(wallet, input.bucket);
    const next = input.direction === "CREDIT" ? current + input.amountRials : current - input.amountRials;
    if (next < 0n) {
      throw new AppError(
        input.bucket === "AVAILABLE"
          ? "موجودی قابل استفاده کیف پول کافی نیست."
          : "موجودی سپرده قفل‌شده کافی نیست.",
        "INSUFFICIENT_FUNDS",
        409,
        {
          walletId: wallet.id,
          bucket: input.bucket,
          availableRials: wallet.availableRials.toString(),
          lockedEscrowRials: wallet.lockedEscrowRials.toString(),
          requestedRials: input.amountRials.toString(),
        }
      );
    }

    const transactionId = `wtx_${crypto.randomUUID()}`;
    const now = new Date();
    await client.insert(walletTransactions).values({
      id: transactionId,
      walletId: wallet.id,
      idempotencyKey: input.idempotencyKey,
      amountRials: input.amountRials,
      direction: input.direction,
      bucket: input.bucket,
      referenceType: input.referenceType,
      referenceId: input.referenceId ?? null,
      description: input.description,
      metadata: input.metadata ?? {},
      balanceAfterRials: next,
      status: "SUCCESS",
      createdAt: now,
    });

    const [updatedWallet] = await client
      .update(wallets)
      .set(
        input.bucket === "AVAILABLE"
          ? { availableRials: next, updatedAt: now }
          : { lockedEscrowRials: next, updatedAt: now }
      )
      .where(eq(wallets.id, wallet.id))
      .returning();

    return {
      walletId: updatedWallet.id,
      transactionId,
      amountRials: input.amountRials,
      direction: input.direction,
      bucket: input.bucket,
      availableRials: updatedWallet.availableRials,
      lockedEscrowRials: updatedWallet.lockedEscrowRials,
      balanceAfterRials: next,
      idempotent: false,
    };
  }

  async reserveEscrowInTransaction(
    client: LedgerClient,
    input: {
      userId: string;
      shiftId: string;
      amountRials: bigint;
      idempotencyBase: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const wallet = await getOrCreateWallet(client, input.userId);
    const availableDebit = await this.postEntryInTransaction(client, {
      walletId: wallet.id,
      idempotencyKey: `${input.idempotencyBase}:available-debit`,
      amountRials: input.amountRials,
      direction: "DEBIT",
      bucket: "AVAILABLE",
      referenceType: "ESCROW_LOCK",
      referenceId: input.shiftId,
      description: "قفل موجودی برای سپرده شیفت",
      metadata: input.metadata,
    });
    const escrowCredit = await this.postEntryInTransaction(client, {
      walletId: wallet.id,
      idempotencyKey: `${input.idempotencyBase}:escrow-credit`,
      amountRials: input.amountRials,
      direction: "CREDIT",
      bucket: "LOCKED_ESCROW",
      referenceType: "ESCROW_LOCK",
      referenceId: input.shiftId,
      description: "افزایش سپرده قفل‌شده شیفت",
      metadata: input.metadata,
    });
    return {
      walletId: wallet.id,
      availableDebitTransactionId: availableDebit.transactionId,
      escrowCreditTransactionId: escrowCredit.transactionId,
      availableRials: escrowCredit.availableRials,
      lockedEscrowRials: escrowCredit.lockedEscrowRials,
      idempotent: availableDebit.idempotent && escrowCredit.idempotent,
    };
  }

  async releaseEscrowInTransaction(
    client: LedgerClient,
    input: {
      walletId: string;
      shiftId: string;
      amountRials: bigint;
      idempotencyBase: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const escrowDebit = await this.postEntryInTransaction(client, {
      walletId: input.walletId,
      idempotencyKey: `${input.idempotencyBase}:escrow-debit`,
      amountRials: input.amountRials,
      direction: "DEBIT",
      bucket: "LOCKED_ESCROW",
      referenceType: "ESCROW_RELEASE",
      referenceId: input.shiftId,
      description: "آزادسازی سپرده قفل‌شده شیفت",
      metadata: input.metadata,
    });
    const availableCredit = await this.postEntryInTransaction(client, {
      walletId: input.walletId,
      idempotencyKey: `${input.idempotencyBase}:available-credit`,
      amountRials: input.amountRials,
      direction: "CREDIT",
      bucket: "AVAILABLE",
      referenceType: "ESCROW_RELEASE",
      referenceId: input.shiftId,
      description: "بازگشت سپرده آزادشده به موجودی قابل استفاده",
      metadata: input.metadata,
    });
    return {
      walletId: input.walletId,
      escrowDebitTransactionId: escrowDebit.transactionId,
      availableCreditTransactionId: availableCredit.transactionId,
      availableRials: availableCredit.availableRials,
      lockedEscrowRials: availableCredit.lockedEscrowRials,
      idempotent: escrowDebit.idempotent && availableCredit.idempotent,
    };
  }

  async consumeEscrowInTransaction(
    client: LedgerClient,
    input: {
      walletId: string;
      amountRials: bigint;
      referenceType: "SETTLEMENT" | "PLATFORM_FEE";
      referenceId: string;
      idempotencyKey: string;
      description: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.postEntryInTransaction(client, {
      walletId: input.walletId,
      idempotencyKey: input.idempotencyKey,
      amountRials: input.amountRials,
      direction: "DEBIT",
      bucket: "LOCKED_ESCROW",
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description,
      metadata: input.metadata,
    });
  }

  async creditWorkerSettlementInTransaction(
    client: LedgerClient,
    input: {
      workerUserId: string;
      timesheetId: string;
      amountRials: bigint;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const wallet = await getOrCreateWallet(client, input.workerUserId);
    return this.postEntryInTransaction(client, {
      walletId: wallet.id,
      idempotencyKey: input.idempotencyKey,
      amountRials: input.amountRials,
      direction: "CREDIT",
      bucket: "AVAILABLE",
      referenceType: "SETTLEMENT",
      referenceId: input.timesheetId,
      description: "واریز درآمد تاییدشده شیفت",
      metadata: input.metadata,
    });
  }

  async reservePayoutInTransaction(
    client: LedgerClient,
    input: {
      workerUserId: string;
      payoutId: string;
      amountRials: bigint;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const wallet = await getOrCreateWallet(client, input.workerUserId);
    return this.postEntryInTransaction(client, {
      walletId: wallet.id,
      idempotencyKey: input.idempotencyKey,
      amountRials: input.amountRials,
      direction: "DEBIT",
      bucket: "AVAILABLE",
      referenceType: "WITHDRAWAL",
      referenceId: input.payoutId,
      description: "رزرو موجودی برای درخواست تسویه بانکی",
      metadata: input.metadata,
    });
  }

  /**
   * Authoritative bridge from a verified WALLET_TOPUP payment into the wallet.
   * This method runs inside the SAME DB transaction that marks the payment verified.
   */
  async creditVerifiedPaymentInTransaction(
    client: LedgerClient,
    payment: PaymentRow
  ): Promise<WalletCreditResult> {
    assertTopupPayment(payment);
    const wallet = await getOrCreateWallet(client, payment.payerUserId);
    const idempotencyKey = `${PAYMENT_CREDIT_PREFIX}${payment.id}`;

    const [byReference] = await client
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.referenceType, "TOPUP"),
          eq(walletTransactions.referenceId, payment.id),
          eq(walletTransactions.direction, "CREDIT"),
          eq(walletTransactions.bucket, "AVAILABLE"),
          eq(walletTransactions.status, "SUCCESS")
        )
      )
      .limit(1);

    if (byReference) {
      validateExistingEntry(byReference, {
        walletId: wallet.id,
        amountRials: payment.amountRials,
        direction: "CREDIT",
        bucket: "AVAILABLE",
        referenceType: "TOPUP",
        referenceId: payment.id,
      });
      if (payment.walletId !== wallet.id) {
        await client
          .update(payments)
          .set({ walletId: wallet.id, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
      }
      const lockedWallet = await readLockedWallet(client, wallet.id);
      return {
        walletId: wallet.id,
        transactionId: byReference.id,
        availableRials: lockedWallet.availableRials,
        lockedEscrowRials: lockedWallet.lockedEscrowRials,
        idempotent: true,
      };
    }

    const posted = await this.postEntryInTransaction(client, {
      walletId: wallet.id,
      idempotencyKey,
      amountRials: payment.amountRials,
      direction: "CREDIT",
      bucket: "AVAILABLE",
      referenceType: "TOPUP",
      referenceId: payment.id,
      description: "شارژ کیف پول از درگاه پرداخت",
      metadata: {
        paymentId: payment.id,
        provider: payment.provider,
        providerRefId: payment.refId,
        purpose: payment.purpose,
      },
    });

    await client
      .update(payments)
      .set({ walletId: wallet.id, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    if (!posted.idempotent) {
      await client.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: payment.payerUserId,
        entityName: "wallet_transaction",
        entityId: posted.transactionId,
        action: "WALLET_PAYMENT_CREDITED",
        details: {
          walletId: wallet.id,
          paymentId: payment.id,
          amountRials: payment.amountRials.toString(),
          balanceAfterRials: posted.balanceAfterRials.toString(),
          provider: payment.provider,
        },
      });
    }

    return {
      walletId: wallet.id,
      transactionId: posted.transactionId,
      availableRials: posted.availableRials,
      lockedEscrowRials: posted.lockedEscrowRials,
      idempotent: posted.idempotent,
    };
  }

  async creditVerifiedPayment(paymentId: string): Promise<WalletCreditResult> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`wallet-payment:${paymentId}`}))`);
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);
      if (!payment) throw new AppError("پرداخت پیدا نشد.", "NOT_FOUND", 404);
      return this.creditVerifiedPaymentInTransaction(tx, payment);
    });
  }

  async getWalletSummary(userId: string): Promise<WalletSummary> {
    return db.transaction(async (tx) => {
      const wallet = await getOrCreateWallet(tx, userId);
      return summaryFromWallet(wallet);
    });
  }

  async listTransactions(
    userId: string,
    options: { limit?: number; cursor?: { createdAt: Date; id: string } } = {}
  ): Promise<{ items: WalletTransactionView[]; nextCursor: { createdAt: Date; id: string } | null }> {
    const limit = Math.min(Math.max(options.limit ?? 25, 1), MAX_PAGE_SIZE);
    const wallet = await this.getWalletSummary(userId);
    const cursorCondition = options.cursor
      ? or(
          lt(walletTransactions.createdAt, options.cursor.createdAt),
          and(
            eq(walletTransactions.createdAt, options.cursor.createdAt),
            lt(walletTransactions.id, options.cursor.id)
          )
        )
      : undefined;

    const rows = await db
      .select()
      .from(walletTransactions)
      .where(
        cursorCondition
          ? and(eq(walletTransactions.walletId, wallet.walletId), cursorCondition)
          : eq(walletTransactions.walletId, wallet.walletId)
      )
      .orderBy(desc(walletTransactions.createdAt), desc(walletTransactions.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const visible = hasMore ? rows.slice(0, limit) : rows;
    const last = visible.at(-1);
    return {
      items: visible.map(transactionToView),
      nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
    };
  }

  /** Read-only integrity check for both Wallet balance buckets. */
  async reconcileProjection(userId: string): Promise<{
    walletId: string;
    projectedAvailableRials: bigint;
    ledgerAvailableRials: bigint;
    availableDriftRials: bigint;
    projectedLockedEscrowRials: bigint;
    ledgerLockedEscrowRials: bigint;
    lockedEscrowDriftRials: bigint;
    consistent: boolean;
  }> {
    const wallet = await this.getWalletSummary(userId);
    const [aggregate] = await db
      .select({
        availableText: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.bucket} = 'AVAILABLE' THEN CASE WHEN ${walletTransactions.direction} = 'CREDIT' THEN ${walletTransactions.amountRials} ELSE -${walletTransactions.amountRials} END ELSE 0 END), 0)::text`,
        lockedText: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.bucket} = 'LOCKED_ESCROW' THEN CASE WHEN ${walletTransactions.direction} = 'CREDIT' THEN ${walletTransactions.amountRials} ELSE -${walletTransactions.amountRials} END ELSE 0 END), 0)::text`,
      })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.walletId, wallet.walletId),
          eq(walletTransactions.status, "SUCCESS")
        )
      );

    const ledgerAvailableRials = BigInt(aggregate?.availableText ?? "0");
    const ledgerLockedEscrowRials = BigInt(aggregate?.lockedText ?? "0");
    const availableDriftRials = wallet.availableRials - ledgerAvailableRials;
    const lockedEscrowDriftRials = wallet.lockedEscrowRials - ledgerLockedEscrowRials;
    return {
      walletId: wallet.walletId,
      projectedAvailableRials: wallet.availableRials,
      ledgerAvailableRials,
      availableDriftRials,
      projectedLockedEscrowRials: wallet.lockedEscrowRials,
      ledgerLockedEscrowRials,
      lockedEscrowDriftRials,
      consistent: availableDriftRials === 0n && lockedEscrowDriftRials === 0n,
    };
  }
}
