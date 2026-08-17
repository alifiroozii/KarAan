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
  direction: "CREDIT" | "DEBIT";
  referenceType:
    | "ESCROW_LOCK"
    | "SETTLEMENT"
    | "REFUND"
    | "TOPUP"
    | "WITHDRAWAL"
    | "PENALTY";
  referenceId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  balanceAfterRials: bigint;
  createdAt: Date;
}

function transactionToView(row: WalletTransactionRow): WalletTransactionView {
  return {
    transactionId: row.id,
    amountRials: row.amountRials,
    direction: row.direction,
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

function validateExistingCredit(
  row: WalletTransactionRow,
  payment: PaymentRow,
  walletId: string
): void {
  const valid =
    row.walletId === walletId &&
    row.amountRials === payment.amountRials &&
    row.direction === "CREDIT" &&
    row.referenceType === "TOPUP" &&
    row.referenceId === payment.id &&
    row.status === "SUCCESS";

  if (!valid) {
    throw new AppError(
      "تعارض در idempotency کیف پول شناسایی شد.",
      "CONFLICT",
      409,
      { paymentId: payment.id, transactionId: row.id }
    );
  }
}

async function getOrCreateWallet(client: LedgerClient, userId: string): Promise<WalletRow> {
  await client.execute(
    sql`select pg_advisory_xact_lock(hashtext(${`wallet-owner:${userId}`}))`
  );

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

export class WalletLedgerService {
  /**
   * Authoritative bridge from a verified WALLET_TOPUP payment into the wallet.
   * This method is designed to run inside the SAME DB transaction that marks
   * the payment verified. Provider/network calls must happen before invoking it.
   */
  async creditVerifiedPaymentInTransaction(
    client: LedgerClient,
    payment: PaymentRow
  ): Promise<WalletCreditResult> {
    assertTopupPayment(payment);

    const wallet = await getOrCreateWallet(client, payment.payerUserId);
    await client.execute(sql`select "id" from "wallets" where "id" = ${wallet.id} for update`);

    const idempotencyKey = `${PAYMENT_CREDIT_PREFIX}${payment.id}`;
    const [byIdempotency] = await client
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.idempotencyKey, idempotencyKey))
      .limit(1);

    if (byIdempotency) {
      validateExistingCredit(byIdempotency, payment, wallet.id);
      if (payment.walletId !== wallet.id) {
        await client
          .update(payments)
          .set({ walletId: wallet.id, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
      }
      return {
        walletId: wallet.id,
        transactionId: byIdempotency.id,
        availableRials: byIdempotency.balanceAfterRials,
        lockedEscrowRials: wallet.lockedEscrowRials,
        idempotent: true,
      };
    }

    // Second idempotency wall: even if the key format changes later, one
    // successful TOPUP CREDIT per Payment reference is allowed.
    const [byPaymentReference] = await client
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.referenceType, "TOPUP"),
          eq(walletTransactions.referenceId, payment.id),
          eq(walletTransactions.direction, "CREDIT"),
          eq(walletTransactions.status, "SUCCESS")
        )
      )
      .limit(1);

    if (byPaymentReference) {
      validateExistingCredit(byPaymentReference, payment, wallet.id);
      if (payment.walletId !== wallet.id) {
        await client
          .update(payments)
          .set({ walletId: wallet.id, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
      }
      return {
        walletId: wallet.id,
        transactionId: byPaymentReference.id,
        availableRials: byPaymentReference.balanceAfterRials,
        lockedEscrowRials: wallet.lockedEscrowRials,
        idempotent: true,
      };
    }

    const [lockedWallet] = await client
      .select()
      .from(wallets)
      .where(eq(wallets.id, wallet.id))
      .limit(1);
    if (!lockedWallet) {
      throw new AppError("کیف پول پیدا نشد.", "NOT_FOUND", 404);
    }

    const nextAvailable = lockedWallet.availableRials + payment.amountRials;
    const transactionId = `wtx_${crypto.randomUUID()}`;
    const now = new Date();

    await client.insert(walletTransactions).values({
      id: transactionId,
      walletId: lockedWallet.id,
      idempotencyKey,
      amountRials: payment.amountRials,
      direction: "CREDIT",
      referenceType: "TOPUP",
      referenceId: payment.id,
      description: "شارژ کیف پول از درگاه پرداخت",
      metadata: {
        paymentId: payment.id,
        provider: payment.provider,
        providerRefId: payment.refId,
        purpose: payment.purpose,
      },
      balanceAfterRials: nextAvailable,
      status: "SUCCESS",
      createdAt: now,
    });

    const [updatedWallet] = await client
      .update(wallets)
      .set({ availableRials: nextAvailable, updatedAt: now })
      .where(eq(wallets.id, lockedWallet.id))
      .returning();

    await client
      .update(payments)
      .set({ walletId: lockedWallet.id, updatedAt: now })
      .where(eq(payments.id, payment.id));

    await client.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: payment.payerUserId,
      entityName: "wallet_transaction",
      entityId: transactionId,
      action: "WALLET_PAYMENT_CREDITED",
      details: {
        walletId: lockedWallet.id,
        paymentId: payment.id,
        amountRials: payment.amountRials.toString(),
        balanceAfterRials: nextAvailable.toString(),
        provider: payment.provider,
      },
    });

    return {
      walletId: updatedWallet.id,
      transactionId,
      availableRials: updatedWallet.availableRials,
      lockedEscrowRials: updatedWallet.lockedEscrowRials,
      idempotent: false,
    };
  }

  /** Safe repair/reconciliation entrypoint for a verified payment. */
  async creditVerifiedPayment(paymentId: string): Promise<WalletCreditResult> {
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`wallet-payment:${paymentId}`}))`
      );
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

  /**
   * Read-only integrity check. `wallets.availableRials` is a projection; the
   * sum of posted ledger entries is the financial source of truth.
   */
  async reconcileProjection(userId: string): Promise<{
    walletId: string;
    projectedAvailableRials: bigint;
    ledgerAvailableRials: bigint;
    driftRials: bigint;
    consistent: boolean;
  }> {
    const wallet = await this.getWalletSummary(userId);
    const [aggregate] = await db
      .select({
        balanceText: sql<string>`COALESCE(SUM(CASE WHEN ${walletTransactions.direction} = 'CREDIT' THEN ${walletTransactions.amountRials} ELSE -${walletTransactions.amountRials} END), 0)::text`,
      })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.walletId, wallet.walletId),
          eq(walletTransactions.status, "SUCCESS")
        )
      );

    const ledgerAvailableRials = BigInt(aggregate?.balanceText ?? "0");
    const driftRials = wallet.availableRials - ledgerAvailableRials;
    return {
      walletId: wallet.walletId,
      projectedAvailableRials: wallet.availableRials,
      ledgerAvailableRials,
      driftRials,
      consistent: driftRials === 0n,
    };
  }
}
