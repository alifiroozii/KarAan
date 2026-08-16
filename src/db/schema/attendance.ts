import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { shiftAssignments } from "./shifts";
import { users } from "./users";

export const attendanceEventTypeEnum = pgEnum("attendance_event_type", [
  "CHECK_IN",
  "CHECK_OUT",
  "BREAK_START",
  "BREAK_END",
]);

export const timesheetStatusEnum = pgEnum("timesheet_status", [
  "SUBMITTED",
  "APPROVED",
  "DISPUTED",
  "ADJUSTMENT_REQUIRED",
  "READY_FOR_SETTLEMENT",
  "SETTLED",
  "VOID",
]);

export const attendanceEvents = pgTable(
  "attendance_events",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    eventType: attendanceEventTypeEnum("event_type").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    isWithinGeofence: boolean("is_within_geofence").notNull(),
    distanceFromTargetMeters: doublePrecision("distance_from_target_meters"),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_attendance_events_assignment_id").on(table.assignmentId),
    index("idx_attendance_events_type").on(table.eventType),
  ]
);

export const locationEvents = pgTable(
  "location_events",
  {
    id: text("id").primaryKey(),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(
      () => shiftAssignments.id,
      { onDelete: "set null" }
    ),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    speed: doublePrecision("speed"),
    batteryLevel: integer("battery_level"),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_location_events_worker_id").on(table.workerId),
    index("idx_location_events_assignment_id").on(table.assignmentId),
    index("idx_location_events_timestamp").on(table.timestamp),
  ]
);

export const breaks = pgTable(
  "breaks",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes").default(0).notNull(),
    isApproved: boolean("is_approved").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_breaks_assignment_id").on(table.assignmentId)]
);

export const timesheets = pgTable(
  "timesheets",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    grossMinutes: integer("gross_minutes").notNull(),
    breakMinutes: integer("break_minutes").notNull(),
    paidBreakMinutes: integer("paid_break_minutes").default(0).notNull(),
    unpaidBreakMinutes: integer("unpaid_break_minutes").default(0).notNull(),
    netWorkedMinutes: integer("net_worked_minutes").notNull(),
    regularMinutes: integer("regular_minutes").default(0).notNull(),
    overtimeMinutes: integer("overtime_minutes").default(0).notNull(),
    unapprovedOvertimeMinutes: integer("unapproved_overtime_minutes").default(0).notNull(),
    hourlyRateRials: bigint("hourly_rate_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    overtimePayRials: bigint("overtime_pay_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    calculatedPayRials: bigint("calculated_pay_rials", {
      mode: "bigint",
    }).notNull(),
    bonusRials: bigint("bonus_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    deductionRials: bigint("deduction_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    finalPayRials: bigint("final_pay_rials", { mode: "bigint" }).notNull(),
    status: timesheetStatusEnum("status").default("SUBMITTED").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    approvedByUserId: text("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    readyForSettlementAt: timestamp("ready_for_settlement_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_timesheets_assignment_id").on(table.assignmentId),
    index("idx_timesheets_assignment_id").on(table.assignmentId),
    index("idx_timesheets_status").on(table.status),
    index("idx_timesheets_created_at").on(table.createdAt),
  ]
);
