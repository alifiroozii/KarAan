# KarAan (کارآن) - Database Architecture & ERD Documentation

This document describes the full PostgreSQL + PostGIS database architecture, entities, relationships, indexes, constraints, and financial ledger rules for the KarAan platform.

---

## 📐 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PROVINCES ||--o{ CITIES : contains
    CITIES ||--o{ DISTRICTS : contains
    CITIES ||--o{ NEIGHBORHOODS : contains

    USERS ||--o{ SESSIONS : has
    USERS ||--o{ DEVICES : has
    USERS ||--o{ OTP_CODES : requests
    USERS ||--o| WORKER_PROFILES : has
    USERS ||--o| EMPLOYER_PROFILES : has
    USERS ||--o| WALLETS : owns

    JOB_CATEGORIES ||--o{ JOB_ROLES : defines
    JOB_ROLES ||--o{ SKILLS : contains
    WORKER_PROFILES ||--o{ WORKER_SKILLS : possesses
    SKILLS ||--o{ WORKER_SKILLS : categorized
    WORKER_PROFILES ||--o{ WORKER_DOCUMENTS : submits
    WORKER_PROFILES ||--o{ WORKER_AVAILABILITIES : sets

    EMPLOYER_PROFILES ||--o{ BUSINESSES : owns
    BUSINESSES ||--o{ BRANCHES : operates
    BUSINESSES ||--o{ BUSINESS_MEMBERS : employs

    BRANCHES ||--o{ SHIFTS : hosts
    SHIFTS ||--o{ SHIFT_SLOTS : divides
    SHIFT_SLOTS ||--o{ SHIFT_OFFERS : targets
    SHIFT_SLOTS ||--o{ SHIFT_ASSIGNMENTS : assigns
    USERS ||--o{ SHIFT_ASSIGNMENTS : assigned_worker

    SHIFT_ASSIGNMENTS ||--o{ ATTENDANCE_EVENTS : logs
    SHIFT_ASSIGNMENTS ||--o{ LOCATION_EVENTS : tracks
    SHIFT_ASSIGNMENTS ||--o{ BREAKS : records
    SHIFT_ASSIGNMENTS ||--o| TIMESHEETS : calculates

    SHIFT_ASSIGNMENTS ||--o{ CANCELLATIONS : causes
    SHIFT_ASSIGNMENTS ||--o{ NO_SHOW_EVENTS : triggers
    WORKER_PROFILES ||--o{ RELIABILITY_EVENTS : modifies_score
    USERS ||--o{ STRIKES : receives
    USERS ||--o{ SANCTIONS : receives

    SHIFT_ASSIGNMENTS ||--o{ RATINGS : evaluates
    EMPLOYER_PROFILES ||--o{ WORKER_ROSTERS : categorizes
    USERS ||--o{ BLOCKS : blocks

    WALLETS ||--o{ WALLET_TRANSACTIONS : records_ledger
    WALLETS ||--o{ PAYMENTS : requests
    PAYMENTS ||--o{ PAYMENT_ATTEMPTS : logs
    PAYMENTS ||--o{ REFUNDS : handles
    WALLETS ||--o{ PAYOUTS : withdraws

    SHIFTS ||--o{ CONVERSATIONS : links
    CONVERSATIONS ||--o{ MESSAGES : contains
    USERS ||--o{ NOTIFICATIONS : receives

    SHIFT_ASSIGNMENTS ||--o{ DISPUTES : flags
    DISPUTES ||--o{ DISPUTE_EVIDENCES : attaches

    USERS ||--o{ AUDIT_LOGS : performs
```

---

## 🏛 Entities Summary (48 Tables)

### 1. Identity & Auth (`users`, `sessions`, `devices`, `otp_codes`)
- `users`: Core identity table with `phone`, `role` (`WORKER`, `EMPLOYER`, `ADMIN`), `fullName`, `isVerified`, `isBlocked`, `deletedAt`.
- `sessions`: Bearer tokens & session expiry tracking.
- `devices`: Push notification tokens and device platforms (`IOS`, `ANDROID`, `WEB`).
- `otp_codes`: Short-lived SMS verification codes.

### 2. Geo Taxonomy (`provinces`, `cities`, `districts`, `neighborhoods`)
- Stores Iran's administrative boundaries and city lat/long points for radial matching.

### 3. Worker Domain (`worker_profiles`, `worker_documents`, `worker_availabilities`, `job_categories`, `job_roles`, `skills`, `worker_skills`)
- `worker_profiles`: Contains `hourlyRateRials` (BigInt), `homeLatitude`/`homeLongitude`, `reliabilityScore` (Decimal), and IBAN bank info.
- `worker_documents`: KYC compliance (`NATIONAL_ID`, `DRIVING_LICENSE`, `HEALTH_CARD`).
- `worker_availabilities`: Recurring day-of-week & date-specific availability slots.

### 4. Employer Domain (`employer_profiles`, `businesses`, `branches`, `business_members`)
- `employer_profiles`: Wallet balance & locked escrow reserves.
- `businesses` & `branches`: Company locations with PostGIS geography coordinates.

### 5. Shift Management (`shifts`, `shift_slots`, `shift_offers`, `shift_assignments`)
- `shifts`: Primary shift entity containing geofence radius, hourly pay rate, total budget (BigInt), `startAt` (UTC), `endAt` (UTC), `status`.
- `shift_assignments`: Separate lifecycle state machine (`MATCHED` ➔ `SETTLED`).

### 6. Attendance & GPS (`attendance_events`, `location_events`, `breaks`, `timesheets`)
- `attendance_events`: GPS geofence validation during check-in/out.
- `timesheets`: Gross, break, and net worked minutes calculation.

### 7. Reliability & Discipline (`cancellations`, `no_show_events`, `reliability_events`, `strikes`, `sanctions`)
- Dynamic reliability score adjustment (+2 on completed shift, -10 late cancel, -25 no-show).

### 8. Financial Engine (`wallets`, `wallet_transactions`, `payments`, `payment_attempts`, `refunds`, `payouts`)
- **Rules**:
  - Money stored strictly as `BigInt` (Rials integer).
  - Idempotent `wallet_transactions` ledger — **NEVER HARD DELETED**.

### 9. System & Audit (`system_settings`, `audit_logs`)
- `audit_logs`: Immutable security audit record — **NEVER HARD DELETED**.

---

## ⚡ Indexing Strategy

1. **B-Tree Indexes**: Applied to all Foreign Keys, `status`, `workerId`, `businessId`, `branchId`, `shiftId`, `startAt`, `createdAt`.
2. **Spatial Geo Index**: GiST indexes on latitude & longitude spatial functions (`ST_DWithin`, `ST_Distance`).
3. **Unique Idempotency Indexes**: Unique indexes on `idempotency_key` in `wallet_transactions` and `payments`.
