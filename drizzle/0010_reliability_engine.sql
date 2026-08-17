ALTER TYPE "reliability_event_type" ADD VALUE IF NOT EXISTS 'WORKER_CANCELLATION';
ALTER TYPE "reliability_event_type" ADD VALUE IF NOT EXISTS 'LATE_ARRIVAL';
ALTER TYPE "reliability_event_type" ADD VALUE IF NOT EXISTS 'EARLY_LEAVE';
ALTER TYPE "reliability_event_type" ADD VALUE IF NOT EXISTS 'MANUAL_ADJUSTMENT';
ALTER TYPE "reliability_event_type" ADD VALUE IF NOT EXISTS 'REVERSAL';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "strike_status" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "sanction_status" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "reliability_events" ALTER COLUMN "score_delta" TYPE numeric(6,2);
ALTER TABLE "reliability_events" ALTER COLUMN "resulting_score" TYPE numeric(6,2);
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "source_type" text;
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "source_id" text;
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "policy_version" text DEFAULT 'v1';
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "previous_score" numeric(6,2);
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "reversed_at" timestamp with time zone;
ALTER TABLE "reliability_events" ADD COLUMN IF NOT EXISTS "reversal_event_id" text;
--> statement-breakpoint
UPDATE "reliability_events"
SET
  "idempotency_key" = COALESCE("idempotency_key", 'legacy:' || "id"),
  "source_type" = COALESCE("source_type", 'LEGACY'),
  "source_id" = COALESCE("source_id", "id"),
  "policy_version" = COALESCE("policy_version", 'legacy'),
  "previous_score" = COALESCE("previous_score", greatest(0, least(100, "resulting_score" - "score_delta")))
WHERE
  "idempotency_key" IS NULL OR
  "source_type" IS NULL OR
  "source_id" IS NULL OR
  "previous_score" IS NULL;
--> statement-breakpoint
ALTER TABLE "reliability_events" ALTER COLUMN "idempotency_key" SET NOT NULL;
ALTER TABLE "reliability_events" ALTER COLUMN "source_type" SET NOT NULL;
ALTER TABLE "reliability_events" ALTER COLUMN "source_id" SET NOT NULL;
ALTER TABLE "reliability_events" ALTER COLUMN "policy_version" SET NOT NULL;
ALTER TABLE "reliability_events" ALTER COLUMN "previous_score" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_reliability_events_idempotency" ON "reliability_events" USING btree ("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_reliability_events_assignment_id" ON "reliability_events" USING btree ("assignment_id");
CREATE INDEX IF NOT EXISTS "idx_reliability_events_source" ON "reliability_events" USING btree ("source_type", "source_id");
CREATE INDEX IF NOT EXISTS "idx_reliability_events_created_at" ON "reliability_events" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "reliability_event_id" text;
ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "status" "strike_status" DEFAULT 'ACTIVE';
ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "weight" integer DEFAULT 1 NOT NULL;
ALTER TABLE "strikes" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
UPDATE "strikes"
SET
  "idempotency_key" = COALESCE("idempotency_key", 'legacy:' || "id"),
  "status" = COALESCE("status", 'ACTIVE'::"strike_status")
WHERE "idempotency_key" IS NULL OR "status" IS NULL;
ALTER TABLE "strikes" ALTER COLUMN "idempotency_key" SET NOT NULL;
ALTER TABLE "strikes" ALTER COLUMN "status" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_strikes_idempotency" ON "strikes" USING btree ("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_strikes_status" ON "strikes" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_strikes_expires_at" ON "strikes" USING btree ("expires_at");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "strikes"
    ADD CONSTRAINT "strikes_reliability_event_id_reliability_events_id_fk"
    FOREIGN KEY ("reliability_event_id") REFERENCES "public"."reliability_events"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sanctions" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
ALTER TABLE "sanctions" ADD COLUMN IF NOT EXISTS "reliability_event_id" text;
ALTER TABLE "sanctions" ADD COLUMN IF NOT EXISTS "status" "sanction_status" DEFAULT 'ACTIVE';
ALTER TABLE "sanctions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
ALTER TABLE "sanctions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
UPDATE "sanctions"
SET
  "idempotency_key" = COALESCE("idempotency_key", 'legacy:' || "id"),
  "status" = COALESCE("status", 'ACTIVE'::"sanction_status"),
  "updated_at" = COALESCE("updated_at", "created_at", now())
WHERE "idempotency_key" IS NULL OR "status" IS NULL;
ALTER TABLE "sanctions" ALTER COLUMN "idempotency_key" SET NOT NULL;
ALTER TABLE "sanctions" ALTER COLUMN "status" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sanctions_idempotency" ON "sanctions" USING btree ("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_sanctions_status" ON "sanctions" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_sanctions_end_at" ON "sanctions" USING btree ("end_at");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sanctions"
    ADD CONSTRAINT "sanctions_reliability_event_id_reliability_events_id_fk"
    FOREIGN KEY ("reliability_event_id") REFERENCES "public"."reliability_events"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
