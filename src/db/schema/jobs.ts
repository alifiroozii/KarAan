import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const jobStatusEnum = pgEnum("job_status", [
  "OPEN",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const jobRequests = pgTable(
  "job_requests",
  {
    id: text("id").primaryKey(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    address: text("address"),
    budget: bigint("budget", { mode: "bigint" }),
    isUrgent: boolean("is_urgent").default(false).notNull(),
    status: jobStatusEnum("status").default("OPEN").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_job_requests_requester_id").on(table.requesterId),
    index("idx_job_requests_category").on(table.category),
    index("idx_job_requests_status").on(table.status),
    index("idx_job_requests_created_at").on(table.createdAt),
  ]
);
