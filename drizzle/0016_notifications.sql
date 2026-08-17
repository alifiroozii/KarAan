DO $$ BEGIN
  CREATE TYPE "notification_channel" AS ENUM ('IN_APP', 'SMS', 'PUSH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "notification_delivery_status" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "notifications"
SET "read_at" = COALESCE("read_at", "created_at")
WHERE "is_read" = true AND "read_at" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notifications_idempotency_key"
  ON "notifications" USING btree ("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_created_at"
  ON "notifications" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "sms_enabled" boolean DEFAULT true NOT NULL,
  "push_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notification_preferences_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_preferences_user"
  ON "notification_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "notification_id" text NOT NULL,
  "channel" "notification_channel" NOT NULL,
  "status" "notification_delivery_status" DEFAULT 'PENDING' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "provider_message_id" text,
  "last_error" text,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk"
    FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "notification_deliveries_attempt_count_check" CHECK ("attempt_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_delivery_channel"
  ON "notification_deliveries" USING btree ("notification_id", "channel");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_delivery_status"
  ON "notification_deliveries" USING btree ("status");
