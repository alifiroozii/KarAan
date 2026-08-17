DO $$ BEGIN
  CREATE TYPE "payment_purpose" AS ENUM ('WALLET_TOPUP', 'SHIFT_PREFUND');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "payment_attempt_type" AS ENUM ('REQUEST', 'CALLBACK', 'VERIFY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payer_user_id" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "purpose" "payment_purpose" DEFAULT 'WALLET_TOPUP' NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reference_id" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_url" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_status_code" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_message" text;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "callback_received_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "failed_at" timestamp with time zone;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "payments" p
SET "payer_user_id" = w."user_id"
FROM "wallets" w
WHERE p."payer_user_id" IS NULL
  AND p."wallet_id" = w."id";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "payments" WHERE "payer_user_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot make payments.payer_user_id NOT NULL: legacy payment has no resolvable payer.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payer_user_id" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "wallet_id" DROP NOT NULL;
UPDATE "payments" SET "description" = 'Legacy payment' WHERE "description" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "description" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payments"
    ADD CONSTRAINT "payments_payer_user_id_users_id_fk"
    FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "payments"
    WHERE "authority" IS NOT NULL
    GROUP BY "provider", "authority"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_payments_provider_authority: duplicate provider authority values exist.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payments_provider_authority"
  ON "payments" USING btree ("provider", "authority");
CREATE INDEX IF NOT EXISTS "idx_payments_payer_user_id"
  ON "payments" USING btree ("payer_user_id");
CREATE INDEX IF NOT EXISTS "idx_payments_purpose"
  ON "payments" USING btree ("purpose");
--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD COLUMN IF NOT EXISTS "attempt_type" "payment_attempt_type";
ALTER TABLE "payment_attempts" ADD COLUMN IF NOT EXISTS "error_code" text;
ALTER TABLE "payment_attempts" ADD COLUMN IF NOT EXISTS "error_message" text;
UPDATE "payment_attempts" SET "attempt_type" = 'REQUEST' WHERE "attempt_type" IS NULL;
ALTER TABLE "payment_attempts" ALTER COLUMN "attempt_type" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_pay_attempts_type"
  ON "payment_attempts" USING btree ("attempt_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_callbacks" (
  "id" text PRIMARY KEY NOT NULL,
  "payment_id" text NOT NULL,
  "provider" "payment_provider" NOT NULL,
  "authority" text NOT NULL,
  "provider_status" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "processing_result" text,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone,
  CONSTRAINT "payment_callbacks_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payment_callbacks"
    ADD CONSTRAINT "payment_callbacks_payment_id_payments_id_fk"
    FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_callbacks_payment_id"
  ON "payment_callbacks" USING btree ("payment_id");
CREATE INDEX IF NOT EXISTS "idx_payment_callbacks_authority"
  ON "payment_callbacks" USING btree ("authority");
