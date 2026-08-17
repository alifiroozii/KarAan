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

export type PaymentPurpose = "WALLET_TOPUP" | "SHIFT_PREFUND";

const MIN_PAYMENT_RIALS = 10_000n;
const MAX_PAYMENT_RIALS = 500_000_000_000n;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function serializePayment(row: typeof payments.$inferSelect, idempotent = false) {
  return {
    paymentId: row.id,
    payerUserId: row.payerUserId,
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
    callbackReceivedAt: row.callbackReceivedAt?.toISOString() ?? null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    idempotent,
    walletMutationDeferred: true as const,
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
      throw new AppError("توضیحات پرداخت باید بین ۳ تا ۲۵۵ کاراکتر باشد.", "VALIDATION_ERROR", 422);
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
            walletMutationDeferred: true,
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

        return { kind: "failed" as const, payment: failed, message };
      }
    });

    if (outcome.kind === "failed") {
      publishRealtimeEvent("user", input.payerUserId, "payment.updated", {
        paymentId: outcome.payment.id,
        status: "FAILED",
        amountRials: outcome.payment.amountRials.toString(),
        purpose: outcome.payment.purpose,
      });
      throw new AppError("ایجاد درخواست پرداخت در درگاه ناموفق بود.", "PAYMENT_PROVIDER_ERROR", 502, {
        paymentId: outcome.payment.id,
      });
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

      if (receipt?.processedAt) {
        return {
          kind: "idempotent" as const,
          payment,
          result: receipt.processingResult ?? payment.status,
        };
      }

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

      if (payment.status === "SUCCESS") {
        await tx
          .update(paymentCallbacks)
          .set({ processingResult: "ALREADY_SUCCESS", processedAt: now })
          .where(eq(paymentCallbacks.id, receipt.id));
        return { kind: "idempotent" as const, payment, result: "ALREADY_SUCCESS" };
      }

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
        return { kind: "failed" as const, payment: failed, result: "GATEWAY_NOT_OK" };
      }

      try {
        const verification = await adapter.verifyPayment(callback.authority, payment.amountRials);
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
          return { kind: "failed" as const, payment: failed, result: "VERIFY_FAILED" };
        }

        const [succeeded] = await tx
          .update(payments)
          .set({
            status: "SUCCESS",
            refId: verification.refId ?? payment.refId,
            providerStatusCode:
              verification.statusCode != null ? String(verification.statusCode) : null,
            providerMessage: verification.message ?? null,
            verifiedAt: new Date(),
            failedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id))
          .returning();

        await tx
          .update(paymentCallbacks)
          .set({
            processingResult: verification.alreadyVerified ? "ALREADY_VERIFIED" : "VERIFIED",
            processedAt: new Date(),
          })
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
            walletMutationDeferred: true,
          },
        });
        return { kind: "success" as const, payment: succeeded, result: "VERIFIED" };
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
        return { kind: "retryable" as const, payment: pending, result: "RETRYABLE_VERIFY_ERROR" };
      }
    });

    if (outcome.kind === "success" || outcome.kind === "failed") {
      publishRealtimeEvent("user", outcome.payment.payerUserId, "payment.updated", {
        paymentId: outcome.payment.id,
        status: outcome.payment.status,
        amountRials: outcome.payment.amountRials.toString(),
        purpose: outcome.payment.purpose,
      });
    }

    return {
      ...serializePayment(outcome.payment, outcome.kind === "idempotent"),
      callbackResult: outcome.result,
      retryable: outcome.kind === "retryable",
    };
  }
}
