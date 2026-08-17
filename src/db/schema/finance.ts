import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { workerProfiles } from "./workers";

export const currencyEnum = pgEnum("currency_type", ["RIAL"]);

export const transactionDirectionEnum = pgEnum("transaction_direction", [
  "CREDIT",
  "DEBIT",
]);

export const referenceTypeEnum = pgEnum("reference_type", [
  "ESCROW_LOCK",
  "SETTLEMENT",
  "REFUND",
  "TOPUP",
  "WITHDRAWAL",
  "PENALTY",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "ZARINPAL",
  "SAMAN",
  "MOCK",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
]);

export const paymentPurposeEnum = pgEnum("payment_purpose", [
  "WALLET_TOPUP",
  "SHIFT_PREFUND",
]);

export const paymentAttemptTypeEnum = pgEnum("payment_attempt_type", [
  "REQUEST",
  "CALLBACK",
  "VERIFY",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "PENDING",
  "PROCESSING",
  "DONE",
  "REJECTED",
]);

export const wallets = pgTable(
  "wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    availableRials: bigint("available_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    lockedEscrowRials: bigint("locked_escrow_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    currency: currencyEnum("currency").default("RIAL").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_wallets_user_id").on(table.userId)]
);

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    amountRials: bigint("amount_rials", { mode: "bigint" }).notNull(),
    direction: transactionDirectionEnum("direction").notNull(),
    referenceType: referenceTypeEnum("reference_type").notNull(),
    referenceId: text("reference_id"),
    balanceAfterRials: bigint("balance_after_rials", { mode: "bigint" }).notNull(),
    status: paymentStatusEnum("status").default("SUCCESS").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_wallet_tx_wallet_id").on(table.walletId),
    index("idx_wallet_tx_idempotency").on(table.idempotencyKey),
    index("idx_wallet_tx_created_at").on(table.createdAt),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    payerUserId: text("payer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    walletId: text("wallet_id").references(() => wallets.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    amountRials: bigint("amount_rials", { mode: "bigint" }).notNull(),
    purpose: paymentPurposeEnum("purpose").default("WALLET_TOPUP").notNull(),
    referenceId: text("reference_id"),
    description: text("description").notNull(),
    provider: paymentProviderEnum("provider").default("MOCK").notNull(),
    authority: text("authority"),
    paymentUrl: text("payment_url"),
    refId: text("ref_id"),
    providerStatusCode: text("provider_status_code"),
    providerMessage: text("provider_message"),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    callbackReceivedAt: timestamp("callback_received_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_payments_payer_user_id").on(table.payerUserId),
    index("idx_payments_wallet_id").on(table.walletId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_purpose").on(table.purpose),
    uniqueIndex("uq_payments_provider_authority").on(table.provider, table.authority),
  ]
);

export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    attemptType: paymentAttemptTypeEnum("attempt_type").notNull(),
    requestPayload: jsonb("request_payload")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    responsePayload: jsonb("response_payload")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    status: paymentStatusEnum("status").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_pay_attempts_payment_id").on(table.paymentId),
    index("idx_pay_attempts_type").on(table.attemptType),
  ]
);

export const paymentCallbacks = pgTable(
  "payment_callbacks",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    authority: text("authority").notNull(),
    providerStatus: text("provider_status").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    processingResult: text("processing_result"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_payment_callbacks_payment_id").on(table.paymentId),
    index("idx_payment_callbacks_authority").on(table.authority),
  ]
);

export const refunds = pgTable(
  "refunds",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "restrict" }),
    amountRials: bigint("amount_rials", { mode: "bigint" }).notNull(),
    reason: text("reason").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_refunds_payment_id").on(table.paymentId)]
);

export const payouts = pgTable(
  "payouts",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    workerProfileId: text("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "restrict" }),
    amountRials: bigint("amount_rials", { mode: "bigint" }).notNull(),
    bankIban: text("bank_iban").notNull(),
    trackingNumber: text("tracking_number"),
    status: payoutStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_payouts_wallet_id").on(table.walletId),
    index("idx_payouts_status").on(table.status),
  ]
);
