DO $$ BEGIN
  CREATE TYPE "backfill_trigger" AS ENUM (
    'NO_SHOW',
    'WORKER_CANCELLATION',
    'EMPLOYER_CANCELLATION',
    'MANUAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "backfill_status" AS ENUM (
    'REQUESTED',
    'DISPATCHING',
    'OFFERED',
    'FILLED',
    'EXHAUSTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "shift_assignments"
  ADD COLUMN IF NOT EXISTS "agreed_bonus_rials" bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backfill_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "shift_id" text NOT NULL,
  "shift_slot_id" text NOT NULL,
  "source_assignment_id" text,
  "trigger" "backfill_trigger" NOT NULL,
  "status" "backfill_status" DEFAULT 'REQUESTED' NOT NULL,
  "urgent_bonus_rials" bigint DEFAULT 0 NOT NULL,
  "max_candidates" integer DEFAULT 8 NOT NULL,
  "offer_ttl_seconds" integer DEFAULT 300 NOT NULL,
  "max_dispatch_attempts" integer DEFAULT 3 NOT NULL,
  "dispatch_attempt_count" integer DEFAULT 0 NOT NULL,
  "offers_created" integer DEFAULT 0 NOT NULL,
  "filled_by_assignment_id" text,
  "last_dispatched_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backfill_offer_links" (
  "id" text PRIMARY KEY NOT NULL,
  "backfill_request_id" text NOT NULL,
  "offer_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_requests"
    ADD CONSTRAINT "backfill_requests_shift_id_shifts_id_fk"
    FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_requests"
    ADD CONSTRAINT "backfill_requests_shift_slot_id_shift_slots_id_fk"
    FOREIGN KEY ("shift_slot_id") REFERENCES "public"."shift_slots"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_requests"
    ADD CONSTRAINT "backfill_requests_source_assignment_id_shift_assignments_id_fk"
    FOREIGN KEY ("source_assignment_id") REFERENCES "public"."shift_assignments"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_requests"
    ADD CONSTRAINT "backfill_requests_filled_by_assignment_id_shift_assignments_id_fk"
    FOREIGN KEY ("filled_by_assignment_id") REFERENCES "public"."shift_assignments"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_offer_links"
    ADD CONSTRAINT "backfill_offer_links_backfill_request_id_backfill_requests_id_fk"
    FOREIGN KEY ("backfill_request_id") REFERENCES "public"."backfill_requests"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_offer_links"
    ADD CONSTRAINT "backfill_offer_links_offer_id_shift_offers_id_fk"
    FOREIGN KEY ("offer_id") REFERENCES "public"."shift_offers"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_backfill_shift_id"
  ON "backfill_requests" USING btree ("shift_id");
CREATE INDEX IF NOT EXISTS "idx_backfill_slot_id"
  ON "backfill_requests" USING btree ("shift_slot_id");
CREATE INDEX IF NOT EXISTS "idx_backfill_status"
  ON "backfill_requests" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_backfill_source_assignment"
  ON "backfill_requests" USING btree ("source_assignment_id");
CREATE INDEX IF NOT EXISTS "idx_backfill_offer_request"
  ON "backfill_offer_links" USING btree ("backfill_request_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_backfill_source_assignment"
  ON "backfill_requests" USING btree ("source_assignment_id")
  WHERE "source_assignment_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_backfill_active_slot"
  ON "backfill_requests" USING btree ("shift_slot_id")
  WHERE "status" IN ('REQUESTED', 'DISPATCHING', 'OFFERED');
CREATE UNIQUE INDEX IF NOT EXISTS "uq_backfill_offer_id"
  ON "backfill_offer_links" USING btree ("offer_id");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "backfill_requests"
    ADD CONSTRAINT "backfill_positive_policy_check"
    CHECK (
      "urgent_bonus_rials" >= 0 AND
      "max_candidates" > 0 AND
      "offer_ttl_seconds" > 0 AND
      "max_dispatch_attempts" > 0 AND
      "dispatch_attempt_count" >= 0 AND
      "offers_created" >= 0
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
