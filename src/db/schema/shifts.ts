import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { businesses, branches } from "./employers";
import { jobRoles } from "./workers";
import { users } from "./users";

export const shiftStatusEnum = pgEnum("shift_status", [
  "DRAFT",
  "PUBLISHED",
  "MATCHING",
  "PARTIALLY_FILLED",
  "FILLED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "TIMESHEET_PENDING",
  "APPROVED",
  "SETTLED",
  "CANCELLED",
  "EXPIRED",
  "DISPUTED",
]);

export const slotStatusEnum = pgEnum("slot_status", [
  "OPEN",
  "FILLED",
  "CANCELLED",
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
]);

export const assignmentStateEnum = pgEnum("assignment_state", [
  "OFFERED",
  "VIEWED",
  "ACCEPTED",
  "DECLINED",
  "RECONFIRM_PENDING",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "CHECKED_IN",
  "ON_BREAK",
  "CHECKED_OUT",
  "COMPLETED",
  "CANCELLED_BY_WORKER",
  "CANCELLED_BY_EMPLOYER",
  "NO_SHOW",
  "LEFT_EARLY",
  "REPLACED",
  "REMOVED",
]);

export const shiftTypeEnum = pgEnum("shift_type", [
  "HOURLY",
  "FULL_SHIFT",
  "ASAP",
  "DAILY",
  "MULTI_DAY",
  "RECURRING",
]);

export const shifts = pgTable(
  "shifts",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").references(() => businesses.id, {
      onDelete: "cascade",
    }),
    branchId: text("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),
    jobRoleId: text("job_role_id").references(() => jobRoles.id, {
      onDelete: "set null",
    }),
    employerId: text("employer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    shiftType: shiftTypeEnum("shift_type").default("HOURLY").notNull(),
    requiredWorkers: integer("required_workers").default(1).notNull(),
    locationName: text("location_name").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    geofenceRadiusMeters: integer("geofence_radius_meters")
      .default(100)
      .notNull(),
    requiredSkills: jsonb("required_skills")
      .$type<string[]>()
      .default([])
      .notNull(),
    minRating: doublePrecision("min_rating").default(0.0).notNull(),
    minReliability: doublePrecision("min_reliability").default(0.0).notNull(),
    dressCode: text("dress_code"),
    toolsNeeded: text("tools_needed"),
    checkinInstructions: text("checkin_instructions"),
    supervisorPhone: text("supervisor_phone"),
    breakDurationMinutes: integer("break_duration_minutes").default(30).notNull(),
    isPaidBreak: integer("is_paid_break").default(0).notNull(),
    hourlyPayRials: bigint("hourly_pay_rials", { mode: "bigint" }).notNull(),
    totalBudgetRials: bigint("total_budget_rials", { mode: "bigint" }).notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: shiftStatusEnum("status").default("DRAFT").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_shifts_business_id").on(table.businessId),
    index("idx_shifts_branch_id").on(table.branchId),
    index("idx_shifts_employer_id").on(table.employerId),
    index("idx_shifts_status").on(table.status),
    index("idx_shifts_start_at").on(table.startAt),
    index("idx_shifts_created_at").on(table.createdAt),
  ]
);

export const shiftSlots = pgTable(
  "shift_slots",
  {
    id: text("id").primaryKey(),
    shiftId: text("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    slotIndex: integer("slot_index").default(0).notNull(),
    requiredSkills: jsonb("required_skills")
      .$type<string[]>()
      .default([])
      .notNull(),
    maxWorkers: integer("max_workers").default(1).notNull(),
    status: slotStatusEnum("status").default("OPEN").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_shift_slots_shift_id").on(table.shiftId),
    index("idx_shift_slots_status").on(table.status),
  ]
);

export const shiftOffers = pgTable(
  "shift_offers",
  {
    id: text("id").primaryKey(),
    shiftSlotId: text("shift_slot_id")
      .notNull()
      .references(() => shiftSlots.id, { onDelete: "cascade" }),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    offeredPayRials: bigint("offered_pay_rials", { mode: "bigint" }).notNull(),
    status: offerStatusEnum("status").default("PENDING").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_shift_offers_slot_id").on(table.shiftSlotId),
    index("idx_shift_offers_worker_id").on(table.workerId),
    index("idx_shift_offers_status").on(table.status),
  ]
);

export const shiftAssignments = pgTable(
  "shift_assignments",
  {
    id: text("id").primaryKey(),
    shiftId: text("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    shiftSlotId: text("shift_slot_id").references(() => shiftSlots.id, {
      onDelete: "set null",
    }),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: assignmentStateEnum("state").default("OFFERED").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    totalBreakMinutes: integer("total_break_minutes").default(0).notNull(),
    actualPayRials: bigint("actual_pay_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_assignments_shift_id").on(table.shiftId),
    index("idx_assignments_worker_id").on(table.workerId),
    index("idx_assignments_state").on(table.state),
    index("idx_assignments_created_at").on(table.createdAt),
  ]
);
