CREATE INDEX IF NOT EXISTS "idx_users_is_blocked"
  ON "users" USING btree ("is_blocked");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_name"
  ON "audit_logs" USING btree ("entity_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action"
  ON "audit_logs" USING btree ("action");
