CREATE TYPE "public"."shift_type" AS ENUM('HOURLY', 'FULL_SHIFT', 'ASAP', 'DAILY', 'MULTI_DAY', 'RECURRING');--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "category" text DEFAULT 'فروشگاهی' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "shift_type" "shift_type" DEFAULT 'HOURLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "required_workers" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "min_rating" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "min_reliability" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "dress_code" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "tools_needed" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "checkin_instructions" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "supervisor_phone" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "break_duration_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "is_paid_break" integer DEFAULT 0 NOT NULL;