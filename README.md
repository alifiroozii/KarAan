# KARVIN (کاروین) - Smart Workforce & On-Demand Labor Marketplace

> **"اتصال هوشمند کار و فرصت"** (Connecting skills to opportunities)

KARVIN is a production-grade, location-aware mobile workforce marketplace connecting skilled and semi-skilled workers (کارگران) with business owners and employers (کارفرمایان) in real-time.

---

## 🌟 Complete Architectural Milestones (Android MVP)

### 1. Architectural Foundation & Persian RTL
- **Clean Architecture + MVVM** with pure domain separation.
- **Material 3 Persian Design System**: Deep Trust Navy (`#0F3460`) and Opportunity Emerald (`#059669`).
- Custom Persian vector branding logo, Persian number/currency formatters (`تومان`).

### 2. Location System & Live Map
- **GPS Location Engine (`DistanceCalculator`)**: Haversine distance engine formatted into natural Persian (`۳۵۰ متر فاصله`, `۱.۴ کیلومتر`).
- **Interactive Map Canvas (`MapScreen`)**:
  - **Worker Mode**: Live nearby job radar, "🟢 آماده به کار هستم" (Available Now) live toggle, 1-click apply.
  - **Employer Mode**: Live available workers radar, specialty category chips, 1-click invite.

### 3. Authentication & Security Architecture
- Phone number verification with rate-limiting.
- 5-digit OTP verification with 120s countdown timer and auto-focus digit boxes.
- `SessionManager` & `UserRoleManager` for session persistence and instant role switching.

### 4. Smart AI Matching Engine
- Heuristic 4-factor scoring algorithm:
  $$\text{Match Score} = (0.40 \times \text{Distance}) + (0.30 \times \text{Skill Match}) + (0.20 \times \text{Rating}) + (0.10 \times \text{Availability})$$
- `MatchScoreBadge` (e.g. `۹۲٪ تطابق هوشمند`) on jobs, applicants, and map sheets.

### 5. Reputation & Multi-Criteria Rating System
- Multi-criteria worker rating: Quality, Attendance, Skill, Behavior.
- Multi-criteria employer rating: Payment reliability, Communication, Working environment.
- Trust Badges:
  - `✅ تایید هویت کاروین` (Identity Verified)
  - `✅ ۱۰۰+ کار موفق` (100+ Completed Shifts)
  - `✅ حضور منظم و دقیق` (Punctual Attendance Rate > 95%)
  - `✅ نیروی برگزیده` (Top-rated > 4.8)

### 6. Wallet & Payment Architecture
- **Worker Wallet**: Real-time balance, completed payments history, and withdrawal to bank Sheba (IR...).
- **Employer Invoicing**: Wage payment breakdown, platform commission (5%), invoice tracking.
- `WalletRepository` and `PaymentRepository`.

### 7. Smart Attendance & GPS Geofence Verification
- Start shift and End shift verification with GPS coordinates and timestamps.
- `ActiveShiftScreen` with live shift duration timer (`۰۳:۴۵:۲۰`) and workplace proximity check.

### 8. Direct Chat & Communication
- Employer ↔ Worker in-app chat with message history.
- Text messaging, location coordinate sharing, and interactive job offer cards.

### 9. Notification Center & Preferences
- Notification center with category filtering (All, Jobs, Shifts, Payments).
- Unread badge counters and notification sound/SMS settings.

### 10. Production Optimization
- Complete Proguard/R8 rules, Release signing configuration, Room indexing, and Kotlin 2.0 compiler optimizations.

---

## 🏗 Directory Structure

```
app/src/main/java/com/karvin/app/
├── KarvinApplication.kt
├── MainActivity.kt
├── di/                          # Hilt DI Modules (App, Database, Repository, Network)
├── data/
│   ├── local/                   # Room DB (Entities, DAOs, Converters), DataStore
│   ├── remote/                  # Retrofit API Services & DTOs
│   ├── location/                # DistanceCalculator, LocationTracker
│   ├── security/                # SessionManager, UserRoleManager
│   └── repository/              # Repositories & 100+ Persian Located Demo Generator
├── domain/
│   ├── model/                   # Pure models (User, Worker, Job, Shift, Wallet, Chat, etc.)
│   ├── repository/              # Repository contracts
│   └── usecase/                 # Auth, Worker, Employer, Matching, Location, Chat, Attendance
└── presentation/
    ├── theme/                   # Material 3 Persian Theme (Dark & Light)
    ├── components/              # Buttons, Cards, Chips, Badges, AppBars, Dialogs
    ├── navigation/              # 5-Tab Navigation Compose Graph
    ├── splash/ & role_selection/
    ├── auth/                    # Login, OTP, Multi-step Registration
    ├── map/                     # Vector Map Canvas & MapScreen
    ├── worker/                  # Home, Jobs, Shifts, Profile
    ├── employer/                # Dashboard, Create Job, Applicants, Shifts, Profile
    ├── wallet/                  # Worker Wallet & Payouts
    ├── attendance/              # Active Shift & GPS Attendance
    ├── chat/                    # Conversations & Chat Detail
    ├── rating/                  # Multi-criteria Rating Dialog
    ├── notifications/           # Notification Center
    └── common/                  # Settings, Edit Profile
```

---

## 🚀 Setup & Run Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/alifiroozii/KarVin.git
   ```
2. Open in **Android Studio** (Koala / Jellyfish / Iguana or later).
3. Android Studio automatically syncs using **Gradle 8.7**.
4. Run on an Android Emulator or physical device (Min SDK: 26, Target SDK: 34).

---

## 🔮 Next Roadmap Phases
1. **Backend Development**: NestJS + PostgreSQL + Prisma/TypeORM REST API & WebSockets.
2. **Admin Dashboard**: Next.js (App Router) + Tailwind CSS management dashboard.
3. **AI Matching System**: Server-side embeddings & spatial PostgreSQL queries (PostGIS).
4. **Real Payment Gateway**: Shaparak / Zarinpal online gateway integration.
