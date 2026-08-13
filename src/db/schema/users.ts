import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "WORKER",
  "EMPLOYER",
  "ADMIN",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workerProfiles = pgTable("worker_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  skills: jsonb("skills").$type<string[]>().default([]).notNull(),
  hourlyRateRials: bigint("hourly_rate_rials", { mode: "bigint" })
    .default(BigInt(0))
    .notNull(),
  homeLatitude: doublePrecision("home_latitude"),
  homeLongitude: doublePrecision("home_longitude"),
  reliabilityScore: numeric("reliability_score", { precision: 5, scale: 2 })
    .default("100.00")
    .notNull(),
  totalCompletedShifts: integer("total_completed_shifts").default(0).notNull(),
  bankIban: text("bank_iban"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const employerProfiles = pgTable("employer_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  businessId: text("business_id"),
  address: text("address"),
  walletBalanceRials: bigint("wallet_balance_rials", { mode: "bigint" })
    .default(BigInt(0))
    .notNull(),
  lockedEscrowRials: bigint("locked_escrow_rials", { mode: "bigint" })
    .default(BigInt(0))
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
