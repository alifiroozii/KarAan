import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  integer,
} from "drizzle-orm/pg-core";
import { shifts } from "./shifts";
import { users } from "./users";

export const assignmentStateEnum = pgEnum("assignment_state", [
  "MATCHED",
  "ACCEPTED",
  "RECONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "CHECKED_IN",
  "WORKING",
  "ON_BREAK",
  "CHECKED_OUT",
  "TIMESHEET_SUBMITTED",
  "APPROVED",
  "SETTLED",
  "CANCELLED",
]);

export const shiftAssignments = pgTable("shift_assignments", {
  id: text("id").primaryKey(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  workerId: text("worker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  state: assignmentStateEnum("state").default("MATCHED").notNull(),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
  totalBreakMinutes: integer("total_break_minutes").default(0).notNull(),
  actualPayRials: bigint("actual_pay_rials", { mode: "bigint" })
    .default(BigInt(0))
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
