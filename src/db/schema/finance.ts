import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";
import { shifts } from "./shifts";
import { shiftAssignments } from "./assignments";
import { users } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "ESCROW_LOCK",
  "SETTLEMENT",
  "REFUND",
  "PENALTY",
  "TOPUP",
  "WITHDRAWAL",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const financialLedger = pgTable("financial_ledger", {
  id: text("id").primaryKey(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  shiftId: text("shift_id").references(() => shifts.id, {
    onDelete: "set null",
  }),
  assignmentId: text("assignment_id").references(() => shiftAssignments.id, {
    onDelete: "set null",
  }),
  senderId: text("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),
  recipientId: text("recipient_id").references(() => users.id, {
    onDelete: "set null",
  }),
  amountRials: bigint("amount_rials", { mode: "bigint" }).notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  status: transactionStatusEnum("status").default("COMPLETED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
