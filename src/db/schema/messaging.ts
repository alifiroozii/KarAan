import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
  index,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { shifts, shiftAssignments } from "./shifts";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "SHIFT_OFFER",
  "RECONFIRM_REMINDER",
  "CHECK_IN_ALERT",
  "PAYMENT_RECEIVED",
  "SYSTEM_ANNOUNCEMENT",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "IN_APP",
  "SMS",
  "PUSH",
]);

export const notificationDeliveryStatusEnum = pgEnum(
  "notification_delivery_status",
  ["PENDING", "PROCESSING", "SENT", "FAILED", "SKIPPED"]
);

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    shiftId: text("shift_id").references(() => shifts.id, {
      onDelete: "cascade",
    }),
    assignmentId: text("assignment_id").references(
      () => shiftAssignments.id,
      { onDelete: "cascade" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_conversations_shift_id").on(table.shiftId),
    index("idx_conversations_assignment_id").on(table.assignmentId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    fileUrl: text("file_url"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_messages_conversation_id").on(table.conversationId),
    index("idx_messages_sender_id").on(table.senderId),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").unique(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    type: notificationTypeEnum("type").notNull(),
    data: jsonb("data").default({}).notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_notifications_user_id").on(table.userId),
    index("idx_notifications_is_read").on(table.isRead),
    index("idx_notifications_user_created_at").on(table.userId, table.createdAt),
  ]
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    smsEnabled: boolean("sms_enabled").default(true).notNull(),
    pushEnabled: boolean("push_enabled").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("uq_notification_preferences_user").on(table.userId)]
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: text("id").primaryKey(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationDeliveryStatusEnum("status").default("PENDING").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_notification_delivery_channel").on(
      table.notificationId,
      table.channel
    ),
    index("idx_notification_delivery_status").on(table.status),
  ]
);
