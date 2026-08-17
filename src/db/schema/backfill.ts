import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { shiftAssignments, shiftOffers, shiftSlots, shifts } from "./shifts";

export const backfillTriggerEnum = pgEnum("backfill_trigger", [
  "NO_SHOW",
  "WORKER_CANCELLATION",
  "EMPLOYER_CANCELLATION",
  "MANUAL",
]);

export const backfillStatusEnum = pgEnum("backfill_status", [
  "REQUESTED",
  "DISPATCHING",
  "OFFERED",
  "FILLED",
  "EXHAUSTED",
  "CANCELLED",
]);

export const backfillRequests = pgTable(
  "backfill_requests",
  {
    id: text("id").primaryKey(),
    shiftId: text("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    shiftSlotId: text("shift_slot_id")
      .notNull()
      .references(() => shiftSlots.id, { onDelete: "cascade" }),
    sourceAssignmentId: text("source_assignment_id").references(
      () => shiftAssignments.id,
      { onDelete: "set null" }
    ),
    trigger: backfillTriggerEnum("trigger").notNull(),
    status: backfillStatusEnum("status").default("REQUESTED").notNull(),
    urgentBonusRials: bigint("urgent_bonus_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    maxCandidates: integer("max_candidates").default(8).notNull(),
    offerTtlSeconds: integer("offer_ttl_seconds").default(300).notNull(),
    maxDispatchAttempts: integer("max_dispatch_attempts").default(3).notNull(),
    dispatchAttemptCount: integer("dispatch_attempt_count").default(0).notNull(),
    offersCreated: integer("offers_created").default(0).notNull(),
    filledByAssignmentId: text("filled_by_assignment_id").references(
      () => shiftAssignments.id,
      { onDelete: "set null" }
    ),
    lastDispatchedAt: timestamp("last_dispatched_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_backfill_shift_id").on(table.shiftId),
    index("idx_backfill_slot_id").on(table.shiftSlotId),
    index("idx_backfill_status").on(table.status),
    index("idx_backfill_source_assignment").on(table.sourceAssignmentId),
    uniqueIndex("uq_backfill_source_assignment")
      .on(table.sourceAssignmentId)
      .where(sql`${table.sourceAssignmentId} is not null`),
    uniqueIndex("uq_backfill_active_slot")
      .on(table.shiftSlotId)
      .where(sql`${table.status} in ('REQUESTED', 'DISPATCHING', 'OFFERED')`),
  ]
);

export const backfillOfferLinks = pgTable(
  "backfill_offer_links",
  {
    id: text("id").primaryKey(),
    backfillRequestId: text("backfill_request_id")
      .notNull()
      .references(() => backfillRequests.id, { onDelete: "cascade" }),
    offerId: text("offer_id")
      .notNull()
      .references(() => shiftOffers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_backfill_offer_request").on(table.backfillRequestId),
    uniqueIndex("uq_backfill_offer_id").on(table.offerId),
  ]
);
