import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const systemSettings = pgTable(
  "system_settings",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: jsonb("value").default({}).notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_sys_settings_key").on(table.key)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    entityName: text("entity_name").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    ipAddress: text("ip_address"),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_audit_logs_actor_id").on(table.actorId),
    index("idx_audit_logs_entity").on(table.entityName, table.entityId),
    index("idx_audit_logs_timestamp").on(table.timestamp),
  ]
);
