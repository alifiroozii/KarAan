DO $$ BEGIN
  CREATE TYPE "no_show_status" AS ENUM ('POTENTIAL', 'FINAL', 'OVERRIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "no_show_events" ALTER COLUMN "reported_by_user_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "status" "no_show_status";
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "previous_assignment_state" text;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "detection_source" text DEFAULT 'SYSTEM' NOT NULL;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "grace_period_minutes" integer DEFAULT 10 NOT NULL;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "final_threshold_minutes" integer DEFAULT 20 NOT NULL;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "strike_recommended" integer DEFAULT 1 NOT NULL;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "detected_at" timestamp with time zone;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "finalized_at" timestamp with time zone;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "overridden_at" timestamp with time zone;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "resolved_by_user_id" text;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "override_reason" text;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "no_show_events" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "no_show_events"
SET
  "status" = COALESCE("status", 'FINAL'::"no_show_status"),
  "detection_source" = CASE WHEN "detection_source" = 'SYSTEM' THEN 'LEGACY' ELSE "detection_source" END,
  "detected_at" = COALESCE("detected_at", "created_at"),
  "finalized_at" = COALESCE("finalized_at", "created_at"),
  "updated_at" = COALESCE("updated_at", "created_at", now())
WHERE "status" IS NULL OR "detected_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "no_show_events" ALTER COLUMN "status" SET DEFAULT 'POTENTIAL';
ALTER TABLE "no_show_events" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "no_show_events" ALTER COLUMN "detected_at" SET DEFAULT now();
ALTER TABLE "no_show_events" ALTER COLUMN "detected_at" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "no_show_events"
    GROUP BY "assignment_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_noshow_assignment_id: duplicate no_show_events exist for an assignment. Review them manually.';
  END IF;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_noshow_assignment_id";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_noshow_assignment_id" ON "no_show_events" USING btree ("assignment_id");
CREATE INDEX IF NOT EXISTS "idx_noshow_status" ON "no_show_events" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_noshow_detected_at" ON "no_show_events" USING btree ("detected_at");
--> statement-breakpoint
ALTER TABLE "no_show_events"
  DROP CONSTRAINT IF EXISTS "no_show_events_reported_by_user_id_users_id_fk";
ALTER TABLE "no_show_events"
  ADD CONSTRAINT "no_show_events_reported_by_user_id_users_id_fk"
  FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "no_show_events"
    ADD CONSTRAINT "no_show_events_resolved_by_user_id_users_id_fk"
    FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "no_show_events"
    ADD CONSTRAINT "no_show_threshold_order_check"
    CHECK ("final_threshold_minutes" > "grace_period_minutes");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
