CREATE TYPE "public"."platform_type" AS ENUM('IOS', 'ANDROID', 'WEB');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('WORKER', 'EMPLOYER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('NATIONAL_ID', 'DRIVING_LICENSE', 'HEALTH_CARD');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'MANAGER', 'SUPERVISOR');--> statement-breakpoint
CREATE TYPE "public"."assignment_state" AS ENUM('MATCHED', 'ACCEPTED', 'RECONFIRMED', 'EN_ROUTE', 'ARRIVED', 'CHECKED_IN', 'WORKING', 'ON_BREAK', 'CHECKED_OUT', 'TIMESHEET_SUBMITTED', 'APPROVED', 'SETTLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('OPEN', 'FILLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."attendance_event_type" AS ENUM('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END');--> statement-breakpoint
CREATE TYPE "public"."timesheet_status" AS ENUM('SUBMITTED', 'APPROVED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."reliability_event_type" AS ENUM('SHIFT_COMPLETED', 'LATE_CANCELLATION', 'NO_SHOW', 'PUNCTUAL_BONUS');--> statement-breakpoint
CREATE TYPE "public"."sanction_type" AS ENUM('TEMPORARY_SUSPENSION', 'PERMANENT_BAN', 'SHIFT_RESTRICTION');--> statement-breakpoint
CREATE TYPE "public"."roster_type" AS ENUM('FAVORITE', 'PREFERRED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."currency_type" AS ENUM('RIAL');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('ZARINPAL', 'SAMAN', 'MOCK');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PROCESSING', 'DONE', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."reference_type" AS ENUM('ESCROW_LOCK', 'SETTLEMENT', 'REFUND', 'TOPUP', 'WITHDRAWAL', 'PENALTY');--> statement-breakpoint
CREATE TYPE "public"."transaction_direction" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('SHIFT_OFFER', 'RECONFIRM_REMINDER', 'CHECK_IN_ALERT', 'PAYMENT_RECEIVED', 'SYSTEM_ANNOUNCEMENT');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"province_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" text PRIMARY KEY NOT NULL,
	"city_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provinces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_token" text NOT NULL,
	"platform" "platform_type" DEFAULT 'WEB' NOT NULL,
	"push_token" text,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"role" "user_role" NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "job_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "worker_availabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_profile_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"specific_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_profile_id" text NOT NULL,
	"document_type" "document_type" NOT NULL,
	"file_url" text NOT NULL,
	"status" "document_status" DEFAULT 'PENDING' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bio" text,
	"hourly_rate_rials" bigint DEFAULT 0 NOT NULL,
	"home_latitude" double precision,
	"home_longitude" double precision,
	"reliability_score" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"completed_shifts_count" integer DEFAULT 0 NOT NULL,
	"bank_iban" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_skills" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_profile_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"years_of_experience" integer DEFAULT 1 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"province_id" text,
	"city_id" text,
	"district_id" text,
	"neighborhood_id" text,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"phone" text,
	"manager_user_id" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'SUPERVISOR' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_profile_id" text NOT NULL,
	"name" text NOT NULL,
	"registration_number" text,
	"logo_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employer_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"national_code" text,
	"wallet_balance_rials" bigint DEFAULT 0 NOT NULL,
	"locked_escrow_rials" bigint DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"shift_id" text NOT NULL,
	"shift_slot_id" text,
	"worker_id" text NOT NULL,
	"state" "assignment_state" DEFAULT 'MATCHED' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"total_break_minutes" integer DEFAULT 0 NOT NULL,
	"actual_pay_rials" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"shift_slot_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"offered_pay_rials" bigint NOT NULL,
	"status" "offer_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"shift_id" text NOT NULL,
	"slot_index" integer DEFAULT 0 NOT NULL,
	"required_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_workers" integer DEFAULT 1 NOT NULL,
	"status" "slot_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text,
	"branch_id" text,
	"job_role_id" text,
	"employer_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location_name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"geofence_radius_meters" integer DEFAULT 100 NOT NULL,
	"required_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hourly_pay_rials" bigint NOT NULL,
	"total_budget_rials" bigint NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" "shift_status" DEFAULT 'DRAFT' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_events" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"event_type" "attendance_event_type" NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"is_within_geofence" boolean NOT NULL,
	"distance_from_target_meters" double precision,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breaks" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_events" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"assignment_id" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"speed" double precision,
	"battery_level" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"gross_minutes" integer NOT NULL,
	"break_minutes" integer NOT NULL,
	"net_worked_minutes" integer NOT NULL,
	"calculated_pay_rials" bigint NOT NULL,
	"bonus_rials" bigint DEFAULT 0 NOT NULL,
	"deduction_rials" bigint DEFAULT 0 NOT NULL,
	"final_pay_rials" bigint NOT NULL,
	"status" timesheet_status DEFAULT 'SUBMITTED' NOT NULL,
	"approved_by_user_id" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cancellations" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"cancelled_by_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"hours_before_start" double precision NOT NULL,
	"penalty_rials" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "no_show_events" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"reported_by_user_id" text NOT NULL,
	"reliability_penalty" numeric(5, 2) DEFAULT '25.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reliability_events" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"assignment_id" text,
	"event_type" "reliability_event_type" NOT NULL,
	"score_delta" numeric(5, 2) NOT NULL,
	"resulting_score" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sanctions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sanction_type" "sanction_type" NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strikes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"issued_by_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"blocker_user_id" text NOT NULL,
	"blocked_user_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"evaluator_id" text NOT NULL,
	"evaluatee_id" text NOT NULL,
	"score" integer NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_rosters" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_profile_id" text NOT NULL,
	"worker_profile_id" text NOT NULL,
	"roster_type" "roster_type" DEFAULT 'FAVORITE' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"request_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "payment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"amount_rials" bigint NOT NULL,
	"provider" "payment_provider" DEFAULT 'MOCK' NOT NULL,
	"authority" text,
	"ref_id" text,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"worker_profile_id" text NOT NULL,
	"amount_rials" bigint NOT NULL,
	"bank_iban" text NOT NULL,
	"tracking_number" text,
	"status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"amount_rials" bigint NOT NULL,
	"reason" text NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"amount_rials" bigint NOT NULL,
	"direction" "transaction_direction" NOT NULL,
	"reference_type" "reference_type" NOT NULL,
	"reference_id" text,
	"balance_after_rials" bigint NOT NULL,
	"status" "payment_status" DEFAULT 'SUCCESS' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"available_rials" bigint DEFAULT 0 NOT NULL,
	"locked_escrow_rials" bigint DEFAULT 0 NOT NULL,
	"currency" "currency_type" DEFAULT 'RIAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"shift_id" text,
	"assignment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"file_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_evidences" (
	"id" text PRIMARY KEY NOT NULL,
	"dispute_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"raised_by_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "dispute_status" DEFAULT 'OPEN' NOT NULL,
	"resolution_notes" text,
	"resolved_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"entity_name" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_role_id_job_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."job_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_availabilities" ADD CONSTRAINT "worker_availabilities_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_neighborhood_id_neighborhoods_id_fk" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."neighborhoods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_user_id_users_id_fk" FOREIGN KEY ("manager_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_employer_profile_id_employer_profiles_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_slot_id_shift_slots_id_fk" FOREIGN KEY ("shift_slot_id") REFERENCES "public"."shift_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_offers" ADD CONSTRAINT "shift_offers_shift_slot_id_shift_slots_id_fk" FOREIGN KEY ("shift_slot_id") REFERENCES "public"."shift_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_offers" ADD CONSTRAINT "shift_offers_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_slots" ADD CONSTRAINT "shift_slots_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_job_role_id_job_roles_id_fk" FOREIGN KEY ("job_role_id") REFERENCES "public"."job_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_events" ADD CONSTRAINT "location_events_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_events" ADD CONSTRAINT "location_events_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellations" ADD CONSTRAINT "cancellations_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellations" ADD CONSTRAINT "cancellations_cancelled_by_user_id_users_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_show_events" ADD CONSTRAINT "no_show_events_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_show_events" ADD CONSTRAINT "no_show_events_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "no_show_events" ADD CONSTRAINT "no_show_events_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reliability_events" ADD CONSTRAINT "reliability_events_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reliability_events" ADD CONSTRAINT "reliability_events_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_user_id_users_id_fk" FOREIGN KEY ("blocker_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_evaluatee_id_users_id_fk" FOREIGN KEY ("evaluatee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_rosters" ADD CONSTRAINT "worker_rosters_employer_profile_id_employer_profiles_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."employer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_rosters" ADD CONSTRAINT "worker_rosters_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_evidences" ADD CONSTRAINT "dispute_evidences_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_assignment_id_shift_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."shift_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_user_id_users_id_fk" FOREIGN KEY ("raised_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cities_province_id" ON "cities" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "idx_cities_slug" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_districts_city_id" ON "districts" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_neighborhoods_city_id" ON "neighborhoods" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_provinces_slug" ON "provinces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_devices_user_id" ON "devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_otp_codes_phone" ON "otp_codes" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_otp_codes_created_at" ON "otp_codes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_categories_slug" ON "job_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_job_roles_category_id" ON "job_roles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_job_roles_slug" ON "job_roles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_skills_role_id" ON "skills" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_worker_avail_profile_id" ON "worker_availabilities" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "idx_worker_docs_profile_id" ON "worker_documents" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "idx_worker_docs_status" ON "worker_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_worker_profiles_user_id" ON "worker_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_worker_profiles_reliability" ON "worker_profiles" USING btree ("reliability_score");--> statement-breakpoint
CREATE INDEX "idx_worker_skills_profile_id" ON "worker_skills" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "idx_worker_skills_skill_id" ON "worker_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_branches_business_id" ON "branches" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_biz_members_biz_id" ON "business_members" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_biz_members_user_id" ON "business_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_employer_id" ON "businesses" USING btree ("employer_profile_id");--> statement-breakpoint
CREATE INDEX "idx_employer_profiles_user_id" ON "employer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_assignments_shift_id" ON "shift_assignments" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_assignments_worker_id" ON "shift_assignments" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_assignments_state" ON "shift_assignments" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_assignments_created_at" ON "shift_assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_shift_offers_slot_id" ON "shift_offers" USING btree ("shift_slot_id");--> statement-breakpoint
CREATE INDEX "idx_shift_offers_worker_id" ON "shift_offers" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_shift_offers_status" ON "shift_offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shift_slots_shift_id" ON "shift_slots" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_shift_slots_status" ON "shift_slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shifts_business_id" ON "shifts" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_branch_id" ON "shifts" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_employer_id" ON "shifts" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_status" ON "shifts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shifts_start_at" ON "shifts" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "idx_shifts_created_at" ON "shifts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_attendance_events_assignment_id" ON "attendance_events" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_events_type" ON "attendance_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_breaks_assignment_id" ON "breaks" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_location_events_worker_id" ON "location_events" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_location_events_assignment_id" ON "location_events" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_location_events_timestamp" ON "location_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_timesheets_assignment_id" ON "timesheets" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_timesheets_status" ON "timesheets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cancellations_assignment_id" ON "cancellations" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_cancellations_user_id" ON "cancellations" USING btree ("cancelled_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_noshow_assignment_id" ON "no_show_events" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_noshow_worker_id" ON "no_show_events" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_reliability_events_worker_id" ON "reliability_events" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_sanctions_user_id" ON "sanctions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_strikes_user_id" ON "strikes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_blocker_id" ON "blocks" USING btree ("blocker_user_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_blocked_id" ON "blocks" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX "idx_ratings_assignment_id" ON "ratings" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_ratings_evaluator_id" ON "ratings" USING btree ("evaluator_id");--> statement-breakpoint
CREATE INDEX "idx_ratings_evaluatee_id" ON "ratings" USING btree ("evaluatee_id");--> statement-breakpoint
CREATE INDEX "idx_roster_employer_id" ON "worker_rosters" USING btree ("employer_profile_id");--> statement-breakpoint
CREATE INDEX "idx_roster_worker_id" ON "worker_rosters" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "idx_pay_attempts_payment_id" ON "payment_attempts" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_payments_wallet_id" ON "payments" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payouts_wallet_id" ON "payouts" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_status" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_refunds_payment_id" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_wallet_id" ON "wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_idempotency" ON "wallet_transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_created_at" ON "wallet_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_wallets_user_id" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_shift_id" ON "conversations" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_assignment_id" ON "conversations" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_id" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender_id" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_dispute_evidences_dispute_id" ON "dispute_evidences" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "idx_disputes_assignment_id" ON "disputes" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_disputes_status" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_id" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_name","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_sys_settings_key" ON "system_settings" USING btree ("key");