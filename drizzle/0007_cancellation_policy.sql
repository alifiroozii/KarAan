ALTER TABLE "cancellations" ADD COLUMN "cancelled_by_side" text;
ALTER TABLE "cancellations" ADD COLUMN "reason_code" text;
ALTER TABLE "cancellations" ADD COLUMN "description" text;
ALTER TABLE "cancellations" ADD COLUMN "minutes_before_start" integer;
ALTER TABLE "cancellations" ADD COLUMN "is_late" integer DEFAULT 0 NOT NULL;
ALTER TABLE "cancellations" ADD COLUMN "worker_compensation_rials" bigint DEFAULT 0 NOT NULL;
ALTER TABLE "cancellations" ADD COLUMN "score_impact" numeric(5,2) DEFAULT '0.00' NOT NULL;
ALTER TABLE "cancellations" ADD COLUMN "policy_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL;

UPDATE "cancellations" AS c
SET
  "cancelled_by_side" = CASE
    WHEN a."worker_id" = c."cancelled_by_user_id" THEN 'WORKER'
    ELSE 'EMPLOYER'
  END,
  "reason_code" = 'OTHER',
  "description" = c."reason",
  "minutes_before_start" = ROUND(c."hours_before_start" * 60)::integer
FROM "shift_assignments" AS a
WHERE a."id" = c."assignment_id";

ALTER TABLE "cancellations" ALTER COLUMN "cancelled_by_side" SET NOT NULL;
ALTER TABLE "cancellations" ALTER COLUMN "reason_code" SET NOT NULL;
ALTER TABLE "cancellations" ALTER COLUMN "minutes_before_start" SET NOT NULL;

ALTER TABLE "cancellations"
  ADD CONSTRAINT "cancellations_cancelled_by_side_check"
  CHECK ("cancelled_by_side" IN ('WORKER', 'EMPLOYER'));

CREATE UNIQUE INDEX "uq_cancellations_assignment_id"
  ON "cancellations" USING btree ("assignment_id");
CREATE INDEX "idx_cancellations_side"
  ON "cancellations" USING btree ("cancelled_by_side");
CREATE INDEX "idx_cancellations_created_at"
  ON "cancellations" USING btree ("created_at");
