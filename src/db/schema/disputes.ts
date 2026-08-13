import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { shiftAssignments } from "./shifts";
import { users } from "./users";

export const disputeStatusEnum = pgEnum("dispute_status", [
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
]);

export const disputes = pgTable(
  "disputes",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: "cascade" }),
    raisedByUserId: text("raised_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    status: disputeStatusEnum("status").default("OPEN").notNull(),
    resolutionNotes: text("resolution_notes"),
    resolvedByUserId: text("resolved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_disputes_assignment_id").on(table.assignmentId),
    index("idx_disputes_status").on(table.status),
  ]
);

export const disputeEvidences = pgTable(
  "dispute_evidences",
  {
    id: text("id").primaryKey(),
    disputeId: text("dispute_id")
      .notNull()
      .references(() => disputes.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull(),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_dispute_evidences_dispute_id").on(table.disputeId)]
);
