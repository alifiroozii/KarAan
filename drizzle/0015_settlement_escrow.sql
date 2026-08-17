DO $$ BEGIN
  CREATE TYPE "wallet_balance_bucket" AS ENUM('AVAILABLE', 'LOCKED_ESCROW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "escrow_status" AS ENUM('ACTIVE', 'PARTIALLY_SETTLED', 'SETTLED', 'RELEASED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "settlement_status" AS ENUM('SETTLED', 'REVERSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "reference_type" ADD VALUE IF NOT EXISTS 'ESCROW_RELEASE';
ALTER TYPE "reference_type" ADD VALUE IF NOT EXISTS 'PLATFORM_FEE';
--> statement-breakpoint
ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "bucket" "wallet_balance_bucket" DEFAULT 'AVAILABLE' NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_wallet_tx_bucket"
  ON "wallet_transactions" USING btree ("wallet_id", "bucket");
--> statement-breakpoint
DROP INDEX IF EXISTS "uq_wallet_tx_topup_payment";
CREATE UNIQUE INDEX "uq_wallet_tx_topup_payment"
  ON "wallet_transactions" USING btree ("reference_id")
  WHERE "reference_type" = 'TOPUP'
    AND "direction" = 'CREDIT'
    AND "bucket" = 'AVAILABLE'
    AND "status" = 'SUCCESS';
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "wallet_transactions"
    WHERE "reference_type" = 'SETTLEMENT'
      AND "direction" = 'CREDIT'
      AND "bucket" = 'AVAILABLE'
      AND "status" = 'SUCCESS'
      AND "reference_id" IS NOT NULL
    GROUP BY "reference_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add settlement worker credit uniqueness: duplicate settlement credits exist.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_wallet_tx_settlement_worker_credit"
  ON "wallet_transactions" USING btree ("reference_id")
  WHERE "reference_type" = 'SETTLEMENT'
    AND "direction" = 'CREDIT'
    AND "bucket" = 'AVAILABLE'
    AND "status" = 'SUCCESS';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shift_escrows" (
  "id" text PRIMARY KEY NOT NULL,
  "shift_id" text NOT NULL UNIQUE,
  "employer_user_id" text NOT NULL,
  "wallet_id" text NOT NULL,
  "idempotency_key" text NOT NULL UNIQUE,
  "employer_fee_bps" integer DEFAULT 1500 NOT NULL,
  "worker_commission_bps" integer DEFAULT 0 NOT NULL,
  "worker_budget_reserved_rials" bigint DEFAULT 0 NOT NULL,
  "fee_reserved_rials" bigint DEFAULT 0 NOT NULL,
  "total_reserved_rials" bigint DEFAULT 0 NOT NULL,
  "remaining_rials" bigint DEFAULT 0 NOT NULL,
  "settled_worker_rials" bigint DEFAULT 0 NOT NULL,
  "settled_fee_rials" bigint DEFAULT 0 NOT NULL,
  "released_rials" bigint DEFAULT 0 NOT NULL,
  "status" "escrow_status" DEFAULT 'ACTIVE' NOT NULL,
  "funded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "shift_escrow_fee_bps_range" CHECK ("employer_fee_bps" >= 0 AND "employer_fee_bps" <= 10000),
  CONSTRAINT "shift_escrow_worker_commission_bps_range" CHECK ("worker_commission_bps" >= 0 AND "worker_commission_bps" <= 10000),
  CONSTRAINT "shift_escrow_reserved_non_negative" CHECK ("total_reserved_rials" >= 0 AND "remaining_rials" >= 0)
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "shift_escrows" ADD CONSTRAINT "shift_escrows_shift_id_shifts_id_fk"
    FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "shift_escrows" ADD CONSTRAINT "shift_escrows_employer_user_id_users_id_fk"
    FOREIGN KEY ("employer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "shift_escrows" ADD CONSTRAINT "shift_escrows_wallet_id_wallets_id_fk"
    FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "idx_shift_escrows_employer" ON "shift_escrows" USING btree ("employer_user_id");
CREATE INDEX IF NOT EXISTS "idx_shift_escrows_wallet" ON "shift_escrows" USING btree ("wallet_id");
CREATE INDEX IF NOT EXISTS "idx_shift_escrows_status" ON "shift_escrows" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settlements" (
  "id" text PRIMARY KEY NOT NULL,
  "timesheet_id" text NOT NULL UNIQUE,
  "assignment_id" text NOT NULL UNIQUE,
  "shift_escrow_id" text NOT NULL,
  "employer_wallet_id" text NOT NULL,
  "worker_wallet_id" text NOT NULL,
  "worker_gross_rials" bigint NOT NULL,
  "worker_commission_bps" integer DEFAULT 0 NOT NULL,
  "worker_commission_rials" bigint DEFAULT 0 NOT NULL,
  "worker_net_rials" bigint NOT NULL,
  "employer_fee_bps" integer NOT NULL,
  "employer_fee_rials" bigint NOT NULL,
  "total_escrow_debit_rials" bigint NOT NULL,
  "employer_settlement_ledger_id" text NOT NULL,
  "employer_fee_ledger_id" text,
  "worker_credit_ledger_id" text NOT NULL,
  "status" "settlement_status" DEFAULT 'SETTLED' NOT NULL,
  "settled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "settlement_amounts_non_negative" CHECK (
    "worker_gross_rials" >= 0 AND
    "worker_commission_rials" >= 0 AND
    "worker_net_rials" >= 0 AND
    "employer_fee_rials" >= 0 AND
    "total_escrow_debit_rials" >= 0
  )
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "settlements" ADD CONSTRAINT "settlements_timesheet_id_timesheets_id_fk"
    FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "settlements" ADD CONSTRAINT "settlements_assignment_id_shift_assignments_id_fk"
    FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "settlements" ADD CONSTRAINT "settlements_shift_escrow_id_shift_escrows_id_fk"
    FOREIGN KEY ("shift_escrow_id") REFERENCES "public"."shift_escrows"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "settlements" ADD CONSTRAINT "settlements_employer_wallet_id_wallets_id_fk"
    FOREIGN KEY ("employer_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "settlements" ADD CONSTRAINT "settlements_worker_wallet_id_wallets_id_fk"
    FOREIGN KEY ("worker_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "idx_settlements_escrow" ON "settlements" USING btree ("shift_escrow_id");
CREATE INDEX IF NOT EXISTS "idx_settlements_worker_wallet" ON "settlements" USING btree ("worker_wallet_id");
CREATE INDEX IF NOT EXISTS "idx_settlements_status" ON "settlements" USING btree ("status");
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "payouts") THEN
    RAISE EXCEPTION 'Prompt 32 payout migration requires payouts to be empty so ledger reservations cannot be inferred unsafely.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "ledger_transaction_id" text;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "failure_reason" text;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "requested_at" timestamp with time zone DEFAULT now();
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "processed_at" timestamp with time zone;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "payouts" ALTER COLUMN "idempotency_key" SET NOT NULL;
ALTER TABLE "payouts" ALTER COLUMN "ledger_transaction_id" SET NOT NULL;
ALTER TABLE "payouts" ALTER COLUMN "requested_at" SET NOT NULL;
ALTER TABLE "payouts" ALTER COLUMN "updated_at" SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE "payouts" ADD CONSTRAINT "payout_amount_positive" CHECK ("amount_rials" > 0);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payouts_idempotency_key" ON "payouts" USING btree ("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payouts_ledger_transaction_id" ON "payouts" USING btree ("ledger_transaction_id");
CREATE INDEX IF NOT EXISTS "idx_payouts_created_at" ON "payouts" USING btree ("created_at");
--> statement-breakpoint
INSERT INTO "system_settings" ("id", "key", "value", "description", "updated_at")
VALUES
  ('sys_settlement_employer_fee_bps', 'settlement.employer_fee_bps', '{"bps":1500}'::jsonb, 'Employer service fee in basis points. 1500 = 15%.', now()),
  ('sys_settlement_worker_commission_bps', 'settlement.worker_commission_bps', '{"bps":0}'::jsonb, 'Worker commission in basis points. Prompt 32 default is 0%.', now())
ON CONFLICT ("key") DO NOTHING;
