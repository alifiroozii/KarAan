ALTER TYPE "public"."user_role" ADD VALUE 'BRANCH_MANAGER' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SHIFT_SUPERVISOR' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SUPPORT_AGENT' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'DISPUTE_AGENT' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'FINANCE_ADMIN' BEFORE 'ADMIN';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SUPER_ADMIN';--> statement-breakpoint
ALTER TABLE "otp_codes" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");