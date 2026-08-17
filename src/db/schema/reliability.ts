import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  numeric,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { shiftAssignments } from "./shifts";
import { users } from "./users";

export const reliabilityEventTypeEnum = pgEnum("reliability_event_type", [
  "SHIFT_COMPLETED",
  "LATE_CANCELLATION",
  "NO_SHOW",
  "PUNCTUAL_BONUS",
]);

export const sanctionTypeEnum = pgEnum("sanction_type", [
  "TEMPORARY_SUSPENSION",
  "PERMANENT_BAN",
  "SHIFT_RESTRICTION",
]);

export const cancellations = pgTable(
  "cancellations",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    cancelledByUserId: text("cancelled_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cancelledBySide: text("cancelled_by_side").notNull(),
    reason: text("reason").notNull(),
    reasonCode: text("reason_code").notNull(),
    description: text("description"),
    hoursBeforeStart: doublePrecision("hours_before_start").notNull(),
    minutesBeforeStart: integer("minutes_before_start").notNull(),
    isLate: integer("is_late").default(0).notNull(),
    penaltyRials: bigint("penalty_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    workerCompensationRials: bigint("worker_compensation_rials", {
      mode: "bigint",
    })
      .default(sql`0`)
      .notNull(),
    scoreImpact: numeric("score_impact", { precision: 5, scale: 2 })
      .default("0.00")
      .notNull(),
    policySnapshot: jsonb("policy_snapshot")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_cancellations_assignment_id").on(table.assignmentId),
    index("idx_cancellations_user_id").on(table.cancelledByUserId),
    index("idx_cancellations_side").on(table.cancelledBySide),
    index("idx_cancellations_created_at").on(table.createdAt),
  ]
);

export const noShowEvents = pgTable(
  "no_show_events",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedByUserId: text("reported_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reliabilityPenalty: numeric("reliability_penalty", {
      precision: 5,
      scale: 2,
    })
      .default("25.00")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_noshow_assignment_id").on(table.assignmentId),
    index("idx_noshow_worker_id").on(table.workerId),
  ]
);

export const reliabilityEvents = pgTable(
  "reliability_events",
  {
    id: text("id").primaryKey(),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(
      () => shiftAssignments.id,
      { onDelete: "set null" }
    ),
    eventType: reliabilityEventTypeEnum("event_type").notNull(),
    scoreDelta: numeric("score_delta", { precision: 5, scale: 2 }).notNull(),
    resultingScore: numeric("resulting_score", {
      precision: 5,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_reliability_events_worker_id").on(table.workerId)]
);

export const strikes = pgTable(
  "strikes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    issuedByUserId: text("issued_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_strikes_user_id").on(table.userId)]
);

export const sanctions = pgTable(
  "sanctions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sanctionType: sanctionTypeEnum("sanction_type").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_sanctions_user_id").on(table.userId)]
);
