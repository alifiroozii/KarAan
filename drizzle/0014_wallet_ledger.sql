ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "description" text DEFAULT 'Legacy wallet transaction' NOT NULL;
ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "wallets" WHERE "available_rials" < 0 OR "locked_escrow_rials" < 0) THEN
    RAISE EXCEPTION 'Cannot enable wallet non-negative constraints: negative wallet projection exists.';
  END IF;
  IF EXISTS (SELECT 1 FROM "wallet_transactions" WHERE "amount_rials" <= 0 OR "balance_after_rials" < 0) THEN
    RAISE EXCEPTION 'Cannot enable ledger constraints: invalid legacy wallet transaction exists.';
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "wallets"
    ADD CONSTRAINT "wallets_available_non_negative" CHECK ("available_rials" >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "wallets"
    ADD CONSTRAINT "wallets_locked_non_negative" CHECK ("locked_escrow_rials" >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "wallet_transactions"
    ADD CONSTRAINT "wallet_tx_amount_positive" CHECK ("amount_rials" > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "wallet_transactions"
    ADD CONSTRAINT "wallet_tx_balance_non_negative" CHECK ("balance_after_rials" >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wallet_tx_reference"
  ON "wallet_transactions" USING btree ("reference_type", "reference_id");
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "wallet_transactions"
    WHERE "reference_type" = 'TOPUP'
      AND "direction" = 'CREDIT'
      AND "status" = 'SUCCESS'
      AND "reference_id" IS NOT NULL
    GROUP BY "reference_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_wallet_tx_topup_payment: duplicate posted top-up credits exist.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_wallet_tx_topup_payment"
  ON "wallet_transactions" USING btree ("reference_id")
  WHERE "reference_type" = 'TOPUP'
    AND "direction" = 'CREDIT'
    AND "status" = 'SUCCESS';
