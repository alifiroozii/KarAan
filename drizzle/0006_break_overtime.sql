DO $$
BEGIN
  CREATE TYPE "overtime_status" AS ENUM (
    'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "overtime_rate_type" AS ENUM (
    'NORMAL_RATE', 'MULTIPLIER', 'FIXED_BONUS'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "shift_assignments"
  ADD COLUMN IF NOT EXISTS "effective_end_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "idx_assignments_effective_end_at"
  ON "shift_assignments" ("effective_end_at");

ALTER TABLE "timesheets"
  ADD COLUMN IF NOT EXISTS "unapproved_overtime_minutes" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "overtime_pay_rials" bigint NOT NULL DEFAULT 0;

-- There can never be two concurrent active breaks for one assignment.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_breaks_active_assignment"
  ON "breaks" ("assignment_id")
  WHERE "end_at" IS NULL;

CREATE TABLE IF NOT EXISTS "overtime_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "assignment_id" text NOT NULL REFERENCES "shift_assignments"("id") ON DELETE CASCADE,
  "shift_id" text NOT NULL REFERENCES "shifts"("id") ON DELETE CASCADE,
  "worker_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "requested_by_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "original_end_at" timestamp with time zone NOT NULL,
  "requested_end_at" timestamp with time zone NOT NULL,
  "requested_minutes" integer NOT NULL,
  "rate_type" "overtime_rate_type" NOT NULL DEFAULT 'NORMAL_RATE',
  "rate_multiplier_bps" integer NOT NULL DEFAULT 10000,
  "fixed_bonus_rials" bigint NOT NULL DEFAULT 0,
  "note" text,
  "status" "overtime_status" NOT NULL DEFAULT 'PENDING',
  "expires_at" timestamp with time zone NOT NULL,
  "responded_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chk_overtime_requested_minutes_positive" CHECK ("requested_minutes" > 0),
  CONSTRAINT "chk_overtime_end_after_original" CHECK ("requested_end_at" > "original_end_at"),
  CONSTRAINT "chk_overtime_multiplier_bps" CHECK ("rate_multiplier_bps" >= 10000 AND "rate_multiplier_bps" <= 30000),
  CONSTRAINT "chk_overtime_fixed_bonus_non_negative" CHECK ("fixed_bonus_rials" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_overtime_assignment"
  ON "overtime_requests" ("assignment_id");
CREATE INDEX IF NOT EXISTS "idx_overtime_worker"
  ON "overtime_requests" ("worker_id");
CREATE INDEX IF NOT EXISTS "idx_overtime_status"
  ON "overtime_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_overtime_expires"
  ON "overtime_requests" ("expires_at");

-- One unresolved offer per assignment. The service also serializes requests with an advisory lock.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_overtime_pending_assignment"
  ON "overtime_requests" ("assignment_id")
  WHERE "status" = 'PENDING';
