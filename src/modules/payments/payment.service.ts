import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  paymentAttempts,
  paymentCallbacks,
  payments,
} from "@/db/schema";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import {
  getConfiguredPaymentProvider,
  getPaymentAdapter,
  type PaymentProviderName,
} from "@/infrastructure/payment";
import type { UserRole } from "@/modules/auth/auth.service";
import {
  WalletLedgerService,
  type WalletCreditResult,
} from "@/modules/wallet/wallet-ledger.service";

export type PaymentPurpose = "WALLET_TOPUP" | "SHIFT_PREFUND";

const MIN_PAYMENT_RIALS = 10_000n;
const MAX_PAYMENT_RIALS = 500_000_000_000n;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const walletLedger = new WalletLedgerService();

function walletPostingStatus(row: typeof payments.$inferSelect) {
  if (row.purpose !== "WALLET_TOPUP") return "NOT_APPLICABLE" as const;
  if (row.status !== "SUCCESS") return "AWAITING_PAYMENT" as const;
  return row.walletId ? ("POSTED" as const) : ("PENDING_LEDGER" as const);
}

function serializePayment(row: typeof payments.$inferSelect, idempotent = false) {
  return {
    paymentId: row.id,
    payerUserId: row.payerUserId,
    walletId: row.walletId,
    amountRials: row.amountRials.toString(),
    purpose: row.purpose,
    referenceId: row.referenceId,
    description: row.description,
    provider: row.provider,
    authority: row.authority,
    paymentUrl: row.paymentUrl,
    refId: row.refId,
    providerStatusCode: row.providerStatusCode,
    providerMessage: row.providerMessage,
    status: row.status,
    walletPostingStatus: walletPostingStatus(row),
    callbackReceivedAt: row.callbackReceivedAt?.toISOString() ?? null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    idempotent,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown payment provider error";
}

function validateAmount(amountRials: bigint) {
  if (amountRials < MIN_PAYMENT_RIALS || amountRials > MAX_PAYMENT_RIALS) {
    throw new AppError(
      "مبلغ پرداخت خارج از محدوده مجاز است.",
      "VALIDATION_ERROR",
      422,
      {
        minRials: MIN_PAYMENT_RIALS.toString(),
        maxRials: MAX_PAYMENT_RIALS.toString(),
      }
    );
  }
  if (amountRials % 10n !== 0n) {
    throw new AppError(
      "مبلغ پرداخت باید مضربی از ۱۰ ریال باشد.",
      "VALIDATION_ERROR",
      422
    );
  }
}

function scopedIdempotencyKey(payerUserId: string, key: string) {
  if (!IDEMPOTENCY_PATTERN.test(key)) {
    throw new AppError(
      "Idempotency-Key باید بین ۸ تا ۱۲۸ کاراکتر و شامل حروف، عدد یا . _ : - باشد.",
      "VALIDATION_ERROR",
      422
    );
  }
  return `payment:${payerUserId}:${key}`;
}

function buildCallbackUrl(paymentId: string, provider: PaymentProviderName) {
  const url = new URL(env.PAYMENT_CALLBACK_URL);
  url.searchParams.set("paymentId", paymentId);
  url.searchParams.set("provider", provider);
  return url.toString();
}

export class PaymentService {
  async createPayment(input: {
    payerUserId: string;
    idempotencyKey: string;
    amountRials: bigint;
    purpose: PaymentPurpose;
    referenceId?: string | null;
    description: string;
  }) {
    validateAmount(input.amountRials);
    const description = input.description.trim();
    if (description.length < 3 || description.length > 255) {
      throw new AppError(
        "توضیحات پرداخت باید بین ۳ تا ۲۵۵ کاراکتر باشد.",
        "VALIDATION_ERROR",
        422
      );
    }

    const provider = getConfiguredPaymentProvider();
    const adapter = getPaymentAdapter(provider);
    const idempotencyKey = scopedIdempotencyKey(input.payerUserId, input.idempotencyKey);

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`payment-create:${idempotencyKey}`}))`
      );

      const [existing] = await tx
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing) {
        const sameRequest =
          existing.payerUserId === input.payerUserId &&
          existing.amountRials === input.amountRials &&
          existing.purpose === input.purpose &&
          (existing.referenceId ?? null) === (input.referenceId ?? null) &&
          existing.description === description &&
          existing.provider === provider;
        if (!sameRequest) {
          throw new AppError(
            "این Idempotency-Key قبلاً برای درخواست پرداخت دیگری استفاده شده است.",
            "CONFLICT",
            409
          );
        }
        return { kind: "existing" as const, payment: existing };
      }

      const now = new Date();
      const paymentId = `pay_${crypto.randomUUID()}`;
      await tx.insert(payments).values({
        id: paymentId,
        payerUserId: input.payerUserId,
        walletId: null,
        idempotencyKey,
        amountRials: input.amountRials,
        purpose: input.purpose,
        referenceId: input.referenceId ?? null,
        description,
        provider,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      });

      const callbackUrl = buildCallbackUrl(paymentId, provider);
      try {
        const requested = await adapter.requestPayment({
          paymentId,
          amountRials: input.amountRials,
          description,
          callbackUrl,
        });

        const [updated] = await tx
          .update(payments)
          .set({
            authority: requested.authority,
            paymentUrl: requested.paymentUrl,
            providerStatusCode:
              requested.statusCode != null ? String(requested.statusCode) : null,
            providerMessage: requested.message ?? null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))
          .returning();

        await tx.insert(paymentAttempts).values({
          id: `pat_${crypto.randomUUID()}`,
          paymentId,
          attemptType: "REQUEST",
          requestPayload: {
            amountRials: input.amountRials.toString(),
            purpose: input.purpose,
            referenceId: input.referenceId ?? null,
          },
          responsePayload: {
            authority: requested.authority,
            statusCode: requested.statusCode ?? null,
          },
          status: "SUCCESS",
          createdAt: new Date(),
        });

        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: input.payerUserId,
          entityName: "payment",
          entityId: paymentId,
          action: "PAYMENT_REQUESTED",
          details: {
            provider,
            amountRials: input.amountRials.toString(),
            purpose: input.purpose,
            referenceId: input.referenceId ?? null,
            ledgerPosting: input.purpose === "WALLET_TOPUP" ? "AFTER_VERIFICATION" : "NOT_APPLICABLE",
          },
        });

        return { kind: "created" as const, payment: updated };
      } catch (error) {
        const message = errorMessage(error);
        const [failed] = await tx
          .update(payments)
          .set({
            status: "FAILED",
            providerMessage: message,
            failedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))
          .returning();

        await tx.insert(paymentAttempts).values({
          id: `pat_${crypto.randomUUID()}`,
          paymentId,
          attemptType: "REQUEST",
          requestPayload: {
            amountRials: input.amountRials.toString(),
            purpose: input.purpose,
            referenceId: input.referenceId ?? null,
          },
          responsePayload: {},
          status: "FAILED",
          errorCode: "PROVIDER_REQUEST_FAILED",
          errorMessage: message,
          createdAt: new Date(),
        });

        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: input.payerUserId,
          entityName: "payment",
          entityId: paymentId,
          action: "PAYMENT_REQUEST_FAILED",
          details: { provider, purpose: input.purpose },
        });

        return { kind: "failed" as const, payment: failed };
      }
    });

    if (outcome.kind === "failed") {
      publishRealtimeEvent("user", input.payerUserId, "payment.updated", {
        paymentId: outcome.payment.id,
        status: "FAILED",
        amountRials: outcome.payment.amountRials.toString(),
        purpose: outcome.payment.purpose,
      });
      throw new AppError(
        "ایجاد درخواست پرداخت در درگاه ناموفق بود.",
        "PAYMENT_PROVIDER_ERROR",
        502,
        { paymentId: outcome.payment.id }
      );
    }

    return serializePayment(outcome.payment, outcome.kind === "existing");
  }

  async getPaymentForActor(paymentId: string, actorUserId: string, role: UserRole) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!payment) throw new AppError("پرداخت پیدا نشد.", "NOT_FOUND", 404);

    const privileged = ["FINANCE_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(role);
    if (!privileged && payment.payerUserId !== actorUserId) {
      throw new AppError("شما به این پرداخت دسترسی ندارید.", "FORBIDDEN", 403);
    }
    return serializePayment(payment);
  }

  async getMockGatewayPayment(authority: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.provider, "MOCK"), eq(payments.authority, authority)))
      .limit(1);
    if (!payment) throw new AppError("پرداخت آزمایشی پیدا نشد.", "NOT_FOUND", 404);
    return serializePayment(payment);
  }

  async handleCallback(input: {
    paymentId: string;
    provider: PaymentProviderName;
    params: Record<string, string | undefined>;
  }) {
    const adapter = getPaymentAdapter(input.provider);
    const callback = adapter.parseCallback(input.params);
    if (!callback.authority || !callback.status) {
      throw new AppError("پارامترهای Callback ناقص هستند.", "VALIDATION_ERROR", 422);
    }

    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`payment-callback:${input.paymentId}`}))`
      );

      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .limit(1);
      if (!payment) throw new AppError("پرداخت Callback پیدا نشد.", "NOT_FOUND", 404);
      if (payment.provider !== input.provider) {
        throw new AppError("Provider پرداخت با Callback تطابق ندارد.", "FORBIDDEN", 403);
      }
      if (!payment.authority || payment.authority !== callback.authority) {
        throw new AppError("Authority پرداخت با Callback تطابق ندارد.", "FORBIDDEN", 403);
      }

      const callbackKey = `callback:${payment.id}:${input.provider}:${callback.authority}:${callback.status}`;
      let [receipt] = await tx
        .select()
        .from(paymentCallbacks)
        .where(eq(paymentCallbacks.idempotencyKey, callbackKey))
        .limit(1);

      const now = new Date();
      if (!receipt) {
        [receipt] = await tx
          .insert(paymentCallbacks)
          .values({
            id: `pcb_${crypto.randomUUID()}`,
            paymentId: payment.id,
            provider: input.provider,
            authority: callback.authority,
            providerStatus: callback.status,
            idempotencyKey: callbackKey,
            receivedAt: now,
          })
          .returning();
      }

      // A Prompt-30-era SUCCESS may exist without a ledger credit. Replaying a
      // callback safely repairs it without re-verifying or double-crediting.
      if (payment.status === "SUCCESS") {
        let walletCredit: WalletCreditResult | null = null;
        let finalizedPayment = payment;
        if (payment.purpose === "WALLET_TOPUP") {
          walletCredit = await walletLedger.creditVerifiedPaymentInTransaction(tx, payment);
          finalizedPayment = { ...payment, walletId: walletCredit.walletId };
        }
        if (!receipt.processedAt) {
          await tx
            .update(paymentCallbacks)
            .set({
              processingResult: walletCredit ? "ALREADY_SUCCESS_LEDGER_ENSURED" : "ALREADY_SUCCESS",
              processedAt: now,
            })
            .where(eq(paymentCallbacks.id, receipt.id));
        }
        return {
          kind: "idempotent" as const,
          payment: finalizedPayment,
          result: walletCredit ? "ALREADY_SUCCESS_LEDGER_ENSURED" : "ALREADY_SUCCESS",
          walletCredit,
        };
      }

      if (receipt.processedAt) {
        return {
          kind: "idempotent" as const,
          payment,
          result: receipt.processingResult ?? payment.status,
          walletCredit: null,
        };
      }

      // FAILED is terminal in this flow. Network uncertainty never marks a
      // payment failed; it remains PENDING and therefore remains retryable.
      if (payment.status === "FAILED") {
        await tx
          .update(paymentCallbacks)
          .set({ processingResult: "ALREADY_FAILED", processedAt: now })
          .where(eq(paymentCallbacks.id, receipt.id));
        return {
          kind: "failed" as const,
          payment,
          result: "ALREADY_FAILED",
          walletCredit: null,
        };
      }

      await tx
        .update(payments)
        .set({ callbackReceivedAt: now, updatedAt: now })
        .where(eq(payments.id, payment.id));

      await tx.insert(paymentAttempts).values({
        id: `pat_${crypto.randomUUID()}`,
        paymentId: payment.id,
        attemptType: "CALLBACK",
        requestPayload: {
          authority: callback.authority,
          providerStatus: callback.status,
        },
        responsePayload: {},
        status: callback.status === "OK" ? "PENDING" : "FAILED",
        createdAt: now,
      });

      if (callback.status !== "OK") {
        const [failed] = await tx
          .update(payments)
          .set({
            status: "FAILED",
            providerStatusCode: callback.status,
            providerMessage: "پرداخت توسط کاربر لغو یا در درگاه ناموفق شد.",
            failedAt: now,
            updatedAt: now,
          })
          .where(eq(payments.id, payment.id))
          .returning();
        await tx
          .update(paymentCallbacks)
          .set({ processingResult: "GATEWAY_NOT_OK", processedAt: now })
          .where(eq(paymentCallbacks.id, receipt.id));
        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: payment.payerUserId,
          entityName: "payment",
          entityId: payment.id,
          action: "PAYMENT_CALLBACK_FAILED",
          details: { provider: input.provider, providerStatus: callback.status },
        });
        return {
          kind: "failed" as const,
          payment: failed,
          result: "GATEWAY_NOT_OK",
          walletCredit: null,
        };
      }

      // Only provider transport/availability errors are retryable. Ledger
      // errors are deliberately NOT swallowed here; the DB transaction rolls
      // back and a later provider 101/already-verified callback can retry safely.
      let verification;
      try {
        verification = await adapter.verifyPayment(callback.authority, payment.amountRials);
      } catch (error) {
        const message = errorMessage(error);
        await tx.insert(paymentAttempts).values({
          id: `pat_${crypto.randomUUID()}`,
          paymentId: payment.id,
          attemptType: "VERIFY",
          requestPayload: {
            authority: callback.authority,
            amountRials: payment.amountRials.toString(),
          },
          responsePayload: {},
          status: "FAILED",
          errorCode: "PROVIDER_VERIFY_RETRYABLE",
          errorMessage: message,
          createdAt: new Date(),
        });
        await tx
          .update(payments)
          .set({ providerMessage: message, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
        await tx
          .update(paymentCallbacks)
          .set({ processingResult: "RETRYABLE_VERIFY_ERROR", processedAt: null })
          .where(eq(paymentCallbacks.id, receipt.id));
        const [pending] = await tx
          .select()
          .from(payments)
          .where(eq(payments.id, payment.id))
          .limit(1);
        return {
          kind: "retryable" as const,
          payment: pending,
          result: "RETRYABLE_VERIFY_ERROR",
          walletCredit: null,
        };
      }

      await tx.insert(paymentAttempts).values({
        id: `pat_${crypto.randomUUID()}`,
        paymentId: payment.id,
        attemptType: "VERIFY",
        requestPayload: {
          authority: callback.authority,
          amountRials: payment.amountRials.toString(),
        },
        responsePayload: {
          success: verification.success,
          alreadyVerified: verification.alreadyVerified ?? false,
          refId: verification.refId ?? null,
          statusCode: verification.statusCode ?? null,
        },
        status: verification.success ? "SUCCESS" : "FAILED",
        errorCode: verification.success ? null : "PROVIDER_VERIFY_FAILED",
        errorMessage: verification.success ? null : verification.message ?? null,
        createdAt: new Date(),
      });

      if (!verification.success) {
        const [failed] = await tx
          .update(payments)
          .set({
            status: "FAILED",
            providerStatusCode:
              verification.statusCode != null ? String(verification.statusCode) : null,
            providerMessage: verification.message ?? "تایید پرداخت ناموفق بود.",
            failedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))
          .returning();
        await tx
          .update(paymentCallbacks)
          .set({ processingResult: "VERIFY_FAILED", processedAt: new Date() })
          .where(eq(paymentCallbacks.id, receipt.id));
        return {
          kind: "failed" as const,
          payment: failed,
          result: "VERIFY_FAILED",
          walletCredit: null,
        };
      }

      const verifiedAt = new Date();
      const [succeeded] = await tx
        .update(payments)
        .set({
          status: "SUCCESS",
          refId: verification.refId ?? payment.refId,
          providerStatusCode:
            verification.statusCode != null ? String(verification.statusCode) : null,
          providerMessage: verification.message ?? null,
          verifiedAt,
          failedAt: null,
          updatedAt: verifiedAt,
        })
        .where(eq(payments.id, payment.id))
        .returning();

      let walletCredit: WalletCreditResult | null = null;
      let finalizedPayment = succeeded;
      if (succeeded.purpose === "WALLET_TOPUP") {
        walletCredit = await walletLedger.creditVerifiedPaymentInTransaction(tx, succeeded);
        finalizedPayment = { ...succeeded, walletId: walletCredit.walletId };
      }

      const processingResult = walletCredit
        ? verification.alreadyVerified
          ? "ALREADY_VERIFIED_AND_CREDITED"
          : "VERIFIED_AND_CREDITED"
        : verification.alreadyVerified
          ? "ALREADY_VERIFIED"
          : "VERIFIED";

      await tx
        .update(paymentCallbacks)
        .set({ processingResult, processedAt: new Date() })
        .where(eq(paymentCallbacks.id, receipt.id));

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: payment.payerUserId,
        entityName: "payment",
        entityId: payment.id,
        action: "PAYMENT_VERIFIED",
        details: {
          provider: input.provider,
          providerStatusCode: verification.statusCode ?? null,
          refId: verification.refId ?? null,
          alreadyVerified: verification.alreadyVerified ?? false,
          walletTransactionId: walletCredit?.transactionId ?? null,
          walletId: walletCredit?.walletId ?? null,
        },
      });

      return {
        kind: "success" as const,
        payment: finalizedPayment,
        result: processingResult,
        walletCredit,
      };
    });

    if (outcome.kind === "success" || outcome.kind === "failed") {
      publishRealtimeEvent("user", outcome.payment.payerUserId, "payment.updated", {
        paymentId: outcome.payment.id,
        status: outcome.payment.status,
        amountRials: outcome.payment.amountRials.toString(),
        purpose: outcome.payment.purpose,
      });
    }

    if (outcome.walletCredit && !outcome.walletCredit.idempotent) {
      publishRealtimeEvent("user", outcome.payment.payerUserId, "wallet.updated", {
        walletId: outcome.walletCredit.walletId,
        userId: outcome.payment.payerUserId,
        availableRials: outcome.walletCredit.availableRials.toString(),
        lockedEscrowRials: outcome.walletCredit.lockedEscrowRials.toString(),
        transactionId: outcome.walletCredit.transactionId,
        reason: "PAYMENT_TOPUP",
      });
    }

    return {
      ...serializePayment(outcome.payment, outcome.kind === "idempotent"),
      callbackResult: outcome.result,
      retryable: outcome.kind === "retryable",
      walletTransactionId: outcome.walletCredit?.transactionId ?? null,
    };
  }
}
