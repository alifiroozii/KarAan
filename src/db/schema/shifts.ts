import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const shiftStatusEnum = pgEnum("shift_status", [
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const shifts = pgTable("shifts", {
  id: text("id").primaryKey(),
  employerId: text("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  locationName: text("location_name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  geofenceRadiusMeters: integer("geofence_radius_meters").default(100).notNull(),
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]).notNull(),
  hourlyPayRials: bigint("hourly_pay_rials", { mode: "bigint" }).notNull(),
  totalBudgetRials: bigint("total_budget_rials", { mode: "bigint" }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: shiftStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
