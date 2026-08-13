import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { shiftAssignments } from "./assignments";
import { users } from "./users";

export const ratings = pgTable("ratings", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => shiftAssignments.id, { onDelete: "cascade" }),
  evaluatorId: text("evaluator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  evaluateeId: text("evaluatee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 1 to 5
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const employerFavorites = pgTable("employer_favorites", {
  id: text("id").primaryKey(),
  employerId: text("employer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workerId: text("worker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
