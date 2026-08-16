ALTER TYPE "timesheet_status" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_REQUIRED';
ALTER TYPE "timesheet_status" ADD VALUE IF NOT EXISTS 'READY_FOR_SETTLEMENT';
ALTER TYPE "timesheet_status" ADD VALUE IF NOT EXISTS 'SETTLED';
ALTER TYPE "timesheet_status" ADD VALUE IF NOT EXISTS 'VOID';

ALTER TABLE "timesheets"
  ADD COLUMN IF NOT EXISTS "paid_break_minutes" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "unpaid_break_minutes" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "regular_minutes" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "overtime_minutes" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hourly_rate_rials" bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "ready_for_settlement_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

-- Existing rows predate the richer breakdown. Preserve their known payable time as regular time.
UPDATE "timesheets"
SET "regular_minutes" = "net_worked_minutes"
WHERE "regular_minutes" = 0 AND "net_worked_minutes" > 0;

-- Do not silently destroy financial history if a pre-Prompt-22 bug produced duplicate rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "timesheets"
    GROUP BY "assignment_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create uq_timesheets_assignment_id: duplicate assignment_id values exist in timesheets';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_timesheets_assignment_id"
  ON "timesheets" ("assignment_id");

CREATE INDEX IF NOT EXISTS "idx_timesheets_created_at"
  ON "timesheets" ("created_at");
