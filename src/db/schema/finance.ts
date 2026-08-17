import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  jsonb,
  index,
  uniqueIndex,
  check,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { workerProfiles } from "./workers";
import { shifts, shiftAssignments } from "./shifts";
import { timesheets } from "./attendance";

export const currencyEnum = pgEnum("currency_type", ["RIAL"]);

export const transactionDirectionEnum = pgEnum("transaction_direction", [
  "CREDIT",
  "DEBIT",
]);

export const walletBalanceBucketEnum = pgEnum("wallet_balance_bucket", [
  "AVAILABLE",
  "LOCKED_ESCROW",
]);

export const referenceTypeEnum = pgEnum("reference_type", [
  "ESCROW_LOCK",
  "ESCROW_RELEASE",
  "SETTLEMENT",
  "PLATFORM_FEE",
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

export const escrowStatusEnum = pgEnum("escrow_status", [
  "ACTIVE",
  "PARTIALLY_SETTLED",
  "SETTLED",
  "RELEASED",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "SETTLED",
  "REVERSED",
]);

export const wallets = pgTable(
  "wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    /**
     * Read-optimized projections. Every mutation MUST have matching immutable
     * wallet_transactions entries in the same database transaction.
     */
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
  (table) => [
    index("idx_wallets_user_id").on(table.userId),
    check("wallets_available_non_negative", sql`${table.availableRials} >= 0`),
    check("wallets_locked_non_negative", sql`${table.lockedEscrowRials} >= 0`),
  ]
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
    /** The balance bucket affected by this immutable entry. */
    bucket: walletBalanceBucketEnum("bucket").default("AVAILABLE").notNull(),
    referenceType: referenceTypeEnum("reference_type").notNull(),
    referenceId: text("reference_id"),
    description: text("description").default("Wallet transaction").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    /** Balance of `bucket` immediately after this posted entry. */
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
    index("idx_wallet_tx_reference").on(table.referenceType, table.referenceId),
    index("idx_wallet_tx_bucket").on(table.walletId, table.bucket),
    uniqueIndex("uq_wallet_tx_topup_payment")
      .on(table.referenceId)
      .where(
        sql`${table.referenceType} = 'TOPUP' AND ${table.direction} = 'CREDIT' AND ${table.bucket} = 'AVAILABLE' AND ${table.status} = 'SUCCESS'`
      ),
    uniqueIndex("uq_wallet_tx_settlement_worker_credit")
      .on(table.referenceId)
      .where(
        sql`${table.referenceType} = 'SETTLEMENT' AND ${table.direction} = 'CREDIT' AND ${table.bucket} = 'AVAILABLE' AND ${table.status} = 'SUCCESS'`
      ),
    check("wallet_tx_amount_positive", sql`${table.amountRials} > 0`),
    check("wallet_tx_balance_non_negative", sql`${table.balanceAfterRials} >= 0`),
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

export const shiftEscrows = pgTable(
  "shift_escrows",
  {
    id: text("id").primaryKey(),
    shiftId: text("shift_id")
      .notNull()
      .unique()
      .references(() => shifts.id, { onDelete: "restrict" }),
    employerUserId: text("employer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    employerFeeBps: integer("employer_fee_bps").default(1500).notNull(),
    workerCommissionBps: integer("worker_commission_bps").default(0).notNull(),
    workerBudgetReservedRials: bigint("worker_budget_reserved_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    feeReservedRials: bigint("fee_reserved_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalReservedRials: bigint("total_reserved_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    remainingRials: bigint("remaining_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    settledWorkerRials: bigint("settled_worker_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    settledFeeRials: bigint("settled_fee_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    releasedRials: bigint("released_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    status: escrowStatusEnum("status").default("ACTIVE").notNull(),
    fundedAt: timestamp("funded_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_shift_escrows_employer").on(table.employerUserId),
    index("idx_shift_escrows_wallet").on(table.walletId),
    index("idx_shift_escrows_status").on(table.status),
    check("shift_escrow_fee_bps_range", sql`${table.employerFeeBps} >= 0 AND ${table.employerFeeBps} <= 10000`),
    check("shift_escrow_worker_commission_bps_range", sql`${table.workerCommissionBps} >= 0 AND ${table.workerCommissionBps} <= 10000`),
    check("shift_escrow_reserved_non_negative", sql`${table.totalReservedRials} >= 0 AND ${table.remainingRials} >= 0`),
  ]
);

export const settlements = pgTable(
  "settlements",
  {
    id: text("id").primaryKey(),
    timesheetId: text("timesheet_id")
      .notNull()
      .unique()
      .references(() => timesheets.id, { onDelete: "restrict" }),
    assignmentId: text("assignment_id")
      .notNull()
      .unique()
      .references(() => shiftAssignments.id, { onDelete: "restrict" }),
    shiftEscrowId: text("shift_escrow_id")
      .notNull()
      .references(() => shiftEscrows.id, { onDelete: "restrict" }),
    employerWalletId: text("employer_wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    workerWalletId: text("worker_wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    workerGrossRials: bigint("worker_gross_rials", { mode: "bigint" }).notNull(),
    workerCommissionBps: integer("worker_commission_bps").default(0).notNull(),
    workerCommissionRials: bigint("worker_commission_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    workerNetRials: bigint("worker_net_rials", { mode: "bigint" }).notNull(),
    employerFeeBps: integer("employer_fee_bps").notNull(),
    employerFeeRials: bigint("employer_fee_rials", { mode: "bigint" }).notNull(),
    totalEscrowDebitRials: bigint("total_escrow_debit_rials", { mode: "bigint" }).notNull(),
    employerSettlementLedgerId: text("employer_settlement_ledger_id").notNull(),
    employerFeeLedgerId: text("employer_fee_ledger_id"),
    workerCreditLedgerId: text("worker_credit_ledger_id").notNull(),
    status: settlementStatusEnum("status").default("SETTLED").notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_settlements_escrow").on(table.shiftEscrowId),
    index("idx_settlements_worker_wallet").on(table.workerWalletId),
    index("idx_settlements_status").on(table.status),
    check("settlement_amounts_non_negative", sql`${table.workerGrossRials} >= 0 AND ${table.workerCommissionRials} >= 0 AND ${table.workerNetRials} >= 0 AND ${table.employerFeeRials} >= 0 AND ${table.totalEscrowDebitRials} >= 0`),
  ]
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
    idempotencyKey: text("idempotency_key").notNull().unique(),
    amountRials: bigint("amount_rials", { mode: "bigint" }).notNull(),
    bankIban: text("bank_iban").notNull(),
    ledgerTransactionId: text("ledger_transaction_id").notNull().unique(),
    trackingNumber: text("tracking_number"),
    failureReason: text("failure_reason"),
    status: payoutStatusEnum("status").default("PENDING").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_payouts_wallet_id").on(table.walletId),
    index("idx_payouts_status").on(table.status),
    index("idx_payouts_created_at").on(table.createdAt),
    check("payout_amount_positive", sql`${table.amountRials} > 0`),
  ]
);
