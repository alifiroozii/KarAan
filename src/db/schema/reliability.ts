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
  "WORKER_CANCELLATION",
  "NO_SHOW",
  "LATE_ARRIVAL",
  "EARLY_LEAVE",
  "PUNCTUAL_BONUS",
  "MANUAL_ADJUSTMENT",
  "REVERSAL",
]);

export const sanctionTypeEnum = pgEnum("sanction_type", [
  "TEMPORARY_SUSPENSION",
  "PERMANENT_BAN",
  "SHIFT_RESTRICTION",
]);

export const strikeStatusEnum = pgEnum("strike_status", [
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
]);

export const sanctionStatusEnum = pgEnum("sanction_status", [
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
]);

export const noShowStatusEnum = pgEnum("no_show_status", [
  "POTENTIAL",
  "FINAL",
  "OVERRIDDEN",
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
    reportedByUserId: text("reported_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: noShowStatusEnum("status").default("POTENTIAL").notNull(),
    previousAssignmentState: text("previous_assignment_state"),
    detectionSource: text("detection_source").default("SYSTEM").notNull(),
    gracePeriodMinutes: integer("grace_period_minutes").default(10).notNull(),
    finalThresholdMinutes: integer("final_threshold_minutes").default(20).notNull(),
    reliabilityPenalty: numeric("reliability_penalty", {
      precision: 5,
      scale: 2,
    })
      .default("25.00")
      .notNull(),
    strikeRecommended: integer("strike_recommended").default(1).notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    overriddenAt: timestamp("overridden_at", { withTimezone: true }),
    resolvedByUserId: text("resolved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    overrideReason: text("override_reason"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_noshow_assignment_id").on(table.assignmentId),
    index("idx_noshow_worker_id").on(table.workerId),
    index("idx_noshow_status").on(table.status),
    index("idx_noshow_detected_at").on(table.detectedAt),
  ]
);

export const reliabilityEvents = pgTable(
  "reliability_events",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(
      () => shiftAssignments.id,
      { onDelete: "set null" }
    ),
    eventType: reliabilityEventTypeEnum("event_type").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    policyVersion: text("policy_version").default("v1").notNull(),
    scoreDelta: numeric("score_delta", { precision: 6, scale: 2 }).notNull(),
    previousScore: numeric("previous_score", { precision: 6, scale: 2 }).notNull(),
    resultingScore: numeric("resulting_score", {
      precision: 6,
      scale: 2,
    }).notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversalEventId: text("reversal_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_reliability_events_idempotency").on(table.idempotencyKey),
    index("idx_reliability_events_worker_id").on(table.workerId),
    index("idx_reliability_events_assignment_id").on(table.assignmentId),
    index("idx_reliability_events_source").on(table.sourceType, table.sourceId),
    index("idx_reliability_events_created_at").on(table.createdAt),
  ]
);

export const strikes = pgTable(
  "strikes",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reliabilityEventId: text("reliability_event_id").references(
      () => reliabilityEvents.id,
      { onDelete: "set null" }
    ),
    status: strikeStatusEnum("status").default("ACTIVE").notNull(),
    weight: integer("weight").default(1).notNull(),
    reason: text("reason").notNull(),
    issuedByUserId: text("issued_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_strikes_idempotency").on(table.idempotencyKey),
    index("idx_strikes_user_id").on(table.userId),
    index("idx_strikes_status").on(table.status),
    index("idx_strikes_expires_at").on(table.expiresAt),
  ]
);

export const sanctions = pgTable(
  "sanctions",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reliabilityEventId: text("reliability_event_id").references(
      () => reliabilityEvents.id,
      { onDelete: "set null" }
    ),
    sanctionType: sanctionTypeEnum("sanction_type").notNull(),
    status: sanctionStatusEnum("status").default("ACTIVE").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    reason: text("reason").notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_sanctions_idempotency").on(table.idempotencyKey),
    index("idx_sanctions_user_id").on(table.userId),
    index("idx_sanctions_status").on(table.status),
    index("idx_sanctions_end_at").on(table.endAt),
  ]
);
