import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  bigint,
  doublePrecision,
  integer,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "NATIONAL_ID",
  "DRIVING_LICENSE",
  "HEALTH_CARD",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const jobCategories = pgTable(
  "job_categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_job_categories_slug").on(table.slug)]
);

export const jobRoles = pgTable(
  "job_roles",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => jobCategories.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_job_roles_category_id").on(table.categoryId),
    index("idx_job_roles_slug").on(table.slug),
  ]
);

export const skills = pgTable(
  "skills",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => jobRoles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_skills_role_id").on(table.roleId)]
);

export const workerVerificationStatusEnum = pgEnum("worker_verification_status", [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
  "BLOCKED",
]);

export const workerProfiles = pgTable(
  "worker_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    hourlyRateRials: bigint("hourly_rate_rials", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    homeLatitude: doublePrecision("home_latitude"),
    homeLongitude: doublePrecision("home_longitude"),
    reliabilityScore: numeric("reliability_score", { precision: 5, scale: 2 })
      .default("100.00")
      .notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    verificationStatus: workerVerificationStatusEnum("verification_status")
      .default("PENDING_VERIFICATION")
      .notNull(),
    completedShiftsCount: integer("completed_shifts_count")
      .default(0)
      .notNull(),
    bankIban: text("bank_iban"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_worker_profiles_user_id").on(table.userId),
    index("idx_worker_profiles_reliability").on(table.reliabilityScore),
    index("idx_worker_profiles_status").on(table.verificationStatus),
  ]
);

export const workerSkills = pgTable(
  "worker_skills",
  {
    id: text("id").primaryKey(),
    workerProfileId: text("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    yearsOfExperience: integer("years_of_experience").default(1).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_worker_skills_profile_id").on(table.workerProfileId),
    index("idx_worker_skills_skill_id").on(table.skillId),
  ]
);

export const workerDocuments = pgTable(
  "worker_documents",
  {
    id: text("id").primaryKey(),
    workerProfileId: text("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    documentType: documentTypeEnum("document_type").notNull(),
    fileUrl: text("file_url").notNull(),
    status: documentStatusEnum("status").default("PENDING").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_worker_docs_profile_id").on(table.workerProfileId),
    index("idx_worker_docs_status").on(table.status),
  ]
);

export const workerAvailabilities = pgTable(
  "worker_availabilities",
  {
    id: text("id").primaryKey(),
    workerProfileId: text("worker_profile_id")
      .notNull()
      .references(() => workerProfiles.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
    startTime: text("start_time").notNull(), // "08:00"
    endTime: text("end_time").notNull(), // "16:00"
    isRecurring: boolean("is_recurring").default(true).notNull(),
    specificDate: timestamp("specific_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_worker_avail_profile_id").on(table.workerProfileId)]
);
