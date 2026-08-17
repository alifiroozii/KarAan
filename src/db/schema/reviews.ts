import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { shiftAssignments } from "./shifts";
import { users } from "./users";
import { employerProfiles } from "./employers";
import { workerProfiles } from "./workers";

export const rosterTypeEnum = pgEnum("roster_type", [
  "FAVORITE",
  "PREFERRED",
  "BLOCKED",
]);

export const ratingDirectionEnum = pgEnum("rating_direction", [
  "WORKER_TO_EMPLOYER",
  "EMPLOYER_TO_WORKER",
]);

export const ratings = pgTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    direction: ratingDirectionEnum("direction").notNull(),
    evaluatorId: text("evaluator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evaluateeId: text("evaluatee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_ratings_assignment_direction").on(table.assignmentId, table.direction),
    index("idx_ratings_assignment_id").on(table.assignmentId),
    index("idx_ratings_evaluator_id").on(table.evaluatorId),
    index("idx_ratings_evaluatee_id").on(table.evaluateeId),
    index("idx_ratings_direction").on(table.direction),
  ]
);

export const workerRosters = pgTable(
  "worker_rosters",
  {
    id: text("id").primaryKey(),
    employerProfileId: text("employer_profile_id")
      .notNull()
      .references(() => employerProfiles.id, { onDelete: "cascade" }),
    workerProfileId: text("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    rosterType: rosterTypeEnum("roster_type").default("FAVORITE").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_roster_employer_id").on(table.employerProfileId),
    index("idx_roster_worker_id").on(table.workerProfileId),
  ]
);

export const blocks = pgTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    blockerUserId: text("blocker_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedUserId: text("blocked_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_blocks_blocker_id").on(table.blockerUserId),
    index("idx_blocks_blocked_id").on(table.blockedUserId),
  ]
);
