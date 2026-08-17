ALTER TABLE "worker_rosters"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "worker_rosters"
    GROUP BY "employer_profile_id", "worker_profile_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_roster_employer_worker: duplicate roster relationships exist. Review them manually.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_roster_employer_worker"
  ON "worker_rosters" USING btree ("employer_profile_id", "worker_profile_id");
CREATE INDEX IF NOT EXISTS "idx_roster_type"
  ON "worker_rosters" USING btree ("roster_type");
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "blocks"
    GROUP BY "blocker_user_id", "blocked_user_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_blocks_pair: duplicate block relationships exist. Review them manually.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_blocks_pair"
  ON "blocks" USING btree ("blocker_user_id", "blocked_user_id");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "blocks"
    ADD CONSTRAINT "blocks_no_self_check" CHECK ("blocker_user_id" <> "blocked_user_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
