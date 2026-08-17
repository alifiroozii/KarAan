DO $$ BEGIN
  CREATE TYPE "rating_direction" AS ENUM ('WORKER_TO_EMPLOYER', 'EMPLOYER_TO_WORKER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN IF NOT EXISTS "direction" "rating_direction";
--> statement-breakpoint
UPDATE "ratings" r
SET "direction" = CASE
  WHEN r."evaluator_id" = a."worker_id" THEN 'WORKER_TO_EMPLOYER'::"rating_direction"
  ELSE 'EMPLOYER_TO_WORKER'::"rating_direction"
END
FROM "shift_assignments" a
WHERE r."assignment_id" = a."id" AND r."direction" IS NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ratings"
    GROUP BY "assignment_id", "direction"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add unique two-way rating constraint: duplicate rating direction exists for an assignment. Review ratings manually.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "direction" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ratings_assignment_direction"
  ON "ratings" USING btree ("assignment_id", "direction");
CREATE INDEX IF NOT EXISTS "idx_ratings_direction"
  ON "ratings" USING btree ("direction");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ratings"
    ADD CONSTRAINT "ratings_score_range_check" CHECK ("score" >= 1 AND "score" <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
