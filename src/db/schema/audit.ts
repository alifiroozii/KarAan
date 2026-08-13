import {
  pgTable,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id, {
    onDelete: "set null",
  }),
  entityName: text("entity_name").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});
