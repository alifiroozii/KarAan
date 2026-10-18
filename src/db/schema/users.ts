import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "WORKER",
  "EMPLOYER",
  "BRANCH_MANAGER",
  "SHIFT_SUPERVISOR",
  "SUPPORT_AGENT",
  "DISPUTE_AGENT",
  "FINANCE_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
]);

export const platformEnum = pgEnum("platform_type", ["IOS", "ANDROID", "WEB"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull().unique(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    role: userRoleEnum("role").notNull(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    isVerified: boolean("is_verified").default(false).notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_phone").on(table.phone),
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
    index("idx_users_is_blocked").on(table.isBlocked),
    index("idx_users_created_at").on(table.createdAt),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_token").on(table.token),
  ]
);

export const devices = pgTable(
  "devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    deviceToken: text("device_token").notNull(),
    platform: platformEnum("platform").default("WEB").notNull(),
    pushToken: text("push_token"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_devices_user_id").on(table.userId)]
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    code: text("code").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_otp_codes_phone").on(table.phone),
    index("idx_otp_codes_created_at").on(table.createdAt),
  ]
);

export const registeredUsers = pgTable(
  "registered_users",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").unique(),
    phone: text("phone").notNull(),
    role: text("role").notNull().default("WORKER"),
    avatarUrl: text("avatar_url"),
    platform: text("platform").notNull().default("WEB"),
    deviceModel: text("device_model").notNull().default("Web Browser"),
    appVersion: text("app_version").notNull().default("KARJOOR v2.4.0"),
    ipAddress: text("ip_address").notNull().default("127.0.0.1"),
    isVerified: boolean("is_verified").notNull().default(true),
    isBlocked: boolean("is_blocked").notNull().default(false),
    provider: text("provider").notNull().default("GMAIL"),
    city: text("city").default("تهران"),
    skills: jsonb("skills").$type<string[]>().default([]),
    submittedRequests: jsonb("submitted_requests").$type<any[]>().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_reg_users_email").on(table.email),
    index("idx_reg_users_phone").on(table.phone),
    index("idx_reg_users_role").on(table.role),
    index("idx_reg_users_platform").on(table.platform),
    index("idx_reg_users_last_login").on(table.lastLoginAt),
  ]
);
