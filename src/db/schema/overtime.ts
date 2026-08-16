import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { shiftAssignments, shifts } from "./shifts";
import { users } from "./users";

export const overtimeStatusEnum = pgEnum("overtime_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
]);

export const overtimeRateTypeEnum = pgEnum("overtime_rate_type", [
  "NORMAL_RATE",
  "MULTIPLIER",
  "FIXED_BONUS",
]);

export const overtimeRequests = pgTable(
  "overtime_requests",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    shiftId: text("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedByUserId: text("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    originalEndAt: timestamp("original_end_at", { withTimezone: true }).notNull(),
    requestedEndAt: timestamp("requested_end_at", { withTimezone: true }).notNull(),
    requestedMinutes: integer("requested_minutes").notNull(),
    rateType: overtimeRateTypeEnum("rate_type").default("NORMAL_RATE").notNull(),
    rateMultiplierBps: integer("rate_multiplier_bps").default(10000).notNull(),
    fixedBonusRials: bigint("fixed_bonus_rials", { mode: "bigint" }).default(0n).notNull(),
    note: text("note"),
    status: overtimeStatusEnum("status").default("PENDING").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_overtime_assignment").on(table.assignmentId),
    index("idx_overtime_worker").on(table.workerId),
    index("idx_overtime_status").on(table.status),
    index("idx_overtime_expires").on(table.expiresAt),
  ]
);
