ALTER TYPE "public"."shift_status" ADD VALUE 'MATCHING' BEFORE 'IN_PROGRESS';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'PARTIALLY_FILLED' BEFORE 'IN_PROGRESS';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'FILLED' BEFORE 'IN_PROGRESS';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'CONFIRMED' BEFORE 'IN_PROGRESS';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'TIMESHEET_PENDING' BEFORE 'CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'APPROVED' BEFORE 'CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'SETTLED' BEFORE 'CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'EXPIRED';--> statement-breakpoint
ALTER TYPE "public"."shift_status" ADD VALUE 'DISPUTED';--> statement-breakpoint
ALTER TABLE "shift_assignments" ALTER COLUMN "state" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_assignments" ALTER COLUMN "state" SET DEFAULT 'OFFERED'::text;--> statement-breakpoint
DROP TYPE "public"."assignment_state";--> statement-breakpoint
CREATE TYPE "public"."assignment_state" AS ENUM('OFFERED', 'VIEWED', 'ACCEPTED', 'DECLINED', 'RECONFIRM_PENDING', 'CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'CHECKED_IN', 'ON_BREAK', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_EMPLOYER', 'NO_SHOW', 'LEFT_EARLY', 'REPLACED', 'REMOVED');--> statement-breakpoint
ALTER TABLE "shift_assignments" ALTER COLUMN "state" SET DEFAULT 'OFFERED'::"public"."assignment_state";--> statement-breakpoint
ALTER TABLE "shift_assignments" ALTER COLUMN "state" SET DATA TYPE "public"."assignment_state" USING "state"::"public"."assignment_state";