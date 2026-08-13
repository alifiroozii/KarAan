import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { provinces, cities, districts, neighborhoods } from "./geo";

export const memberRoleEnum = pgEnum("member_role", [
  "OWNER",
  "MANAGER",
  "SUPERVISOR",
]);

export const employerProfiles = pgTable(
  "employer_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    nationalCode: text("national_code"),
    walletBalanceRials: bigint("wallet_balance_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    lockedEscrowRials: bigint("locked_escrow_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_employer_profiles_user_id").on(table.userId)]
);

export const businesses = pgTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    employerProfileId: text("employer_profile_id")
      .notNull()
      .references(() => employerProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    registrationNumber: text("registration_number"),
    logoUrl: text("logo_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_businesses_employer_id").on(table.employerProfileId),
  ]
);

export const branches = pgTable(
  "branches",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    provinceId: text("province_id").references(() => provinces.id, {
      onDelete: "set null",
    }),
    cityId: text("city_id").references(() => cities.id, {
      onDelete: "set null",
    }),
    districtId: text("district_id").references(() => districts.id, {
      onDelete: "set null",
    }),
    neighborhoodId: text("neighborhood_id").references(() => neighborhoods.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    phone: text("phone"),
    managerUserId: text("manager_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_branches_business_id").on(table.businessId)]
);

export const businessMembers = pgTable(
  "business_members",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("SUPERVISOR").notNull(),
    permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_biz_members_biz_id").on(table.businessId),
    index("idx_biz_members_user_id").on(table.userId),
  ]
);
