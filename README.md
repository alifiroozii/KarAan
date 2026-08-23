# KARVIN (کاروین) - Smart Workforce Platform

> **"اتصال هوشمند کار و فرصت"** (Connecting skills to opportunities)

KARVIN is a smart workforce and on-demand labor platform connecting skilled and semi-skilled workers (کارگران) with business owners and employers (کارفرمایان).

This repository contains the complete native Android application built from scratch with **Kotlin**, **Jetpack Compose (Material 3)**, **Clean Architecture**, **MVVM**, **Hilt Dependency Injection**, **Room Database**, **DataStore Preferences**, and **Full Persian RTL Support**.

---

## 📱 Features & Workflows

### 1. First Launch & Onboarding
- **Animated Splash Screen**: Branded KARVIN logo with animated pulse and Persian typography.
- **Role Selection Screen**: Clear choice between **Worker (کارگر)** and **Employer (کارفرما)**.

### 2. Authentication & Verification
- Mobile number login interface (۰۹۱۲۳۴۵۶۷۸۹ format validation).
- 5-digit OTP verification screen with quick test autofill.
- Local fake authentication layer architecture ready for future JWT / SMS gateway integration.

### 3. Worker Experience (کارگر)
- **Multi-Step Registration**:
  - **Step 1: Personal Info**: Full name, National ID (کد ملی), Birth date, Gender, Profile photo.
  - **Step 2: Professional Info**: Category selection, dynamic skill chips selection, Experience years, City, Address.
  - **Step 3: Availability**: Working days selector, Available shift hours, Preferred jobs.
- **Worker Home Dashboard**:
  - Greeting header & profile summary.
  - "آماده به کار" (Availability) live toggle switch.
  - 5 Key Metric Cards:
    1. فرصت‌های کاری نزدیک (Nearby jobs count)
    2. درخواست‌های من (My applications)
    3. شیفت‌های فعال (Active shifts)
    4. درآمد این ماه (Monthly income in Toman)
    5. امتیاز عملکرد (Performance rating)
  - Urgent Jobs (فرصت‌های فوری کاری) section with one-click direct application.
- **Jobs Discovery (`WorkerJobsScreen`)**:
  - Real-time search by job title, skill, or keyword.
  - Horizontal category filter chips (ساختمان، انبارداری، فنی، رستوران، نظافت، حمل‌ونقل).
  - Job Cards with salary, working hours, required skills tags, and location.
- **Job Details (`JobDetailsScreen`)**:
  - Full job description, employer business info, salary breakdown, working hours, and "درخواست همکاری" action.
- **Shifts Management (`WorkerShiftsScreen`)**:
  - Tabs: پیش‌رو (Upcoming), در حال انجام (In Progress), پایان یافته (Completed).
  - Actions: "ثبت ورود به شیفت" (Check-in) and "ثبت پایان شیفت" (Check-out & settlement).
- **Worker Profile (`WorkerProfileScreen`)**:
  - Performance rating stars, completed project count, total earnings, skill badges, settings, and logout.

### 4. Employer Experience (کارفرما)
- **Employer Registration**:
  - Manager name, Business/Workshop name, Business category, City, Address, Contact phone.
- **Employer Dashboard (`EmployerDashboardScreen`)**:
  - Business profile header with Verified badge.
  - Fast action banner: **"ثبت درخواست نیروی جدید"**.
  - 4 Key Metrics:
    1. آگهی‌های ثبت شده (Posted jobs count)
    2. درخواست‌های دریافتی (Received applicants)
    3. نیروهای تایید شده (Approved workers)
    4. شیفت‌های در حال اجرا (Active shifts)
  - List of active employer job posts.
- **Create Job Post (`CreateJobScreen`)**:
  - Fields: Job title, Scope & description, Category selector, Number of workers needed, Date, Start/End times, Salary in Toman, City/Address, Required skills tags, Urgent status switch.
- **Applicant Management (`EmployerApplicantsScreen`)**:
  - Filter tabs: همه (All), در انتظار بررسی (Pending), تایید شده (Accepted), رد شده (Rejected).
  - Applicant cards showing worker rating, experience years, matching skills.
  - Actions: **تایید نیرو (Accept)**, **رد درخواست (Reject)**.
  - **Rate Worker Modal**: 5-star rating system with feedback comment dialog.
- **Employer Shifts (`EmployerShiftsScreen`)**:
  - Live tracking of hired workers across upcoming and ongoing work shifts.
- **Employer Profile (`EmployerProfileScreen`)**:
  - Business information, posted jobs count, settings, and logout.

### 5. Shared Screens
- **Notification Center (`NotificationScreen`)**: Filtered alerts for job applications, shift reminders, payments, and system notifications with "Mark all as read".
- **Settings (`SettingsScreen`)**: Dark mode toggle, push notification toggles, language, and privacy.
- **Edit Profile (`EditProfileScreen`)**: Name, bio, avatar placeholder, and city/address update.

---

## 🏗 Tech Stack & Architecture

```
app/src/main/java/com/karvin/app/
├── KarvinApplication.kt         # Hilt Application initialization
├── MainActivity.kt              # Root activity with RTL Layout & Material3 Theme
├── di/                          # Hilt Dependency Injection Modules
│   ├── AppModule.kt
│   ├── DatabaseModule.kt
│   ├── RepositoryModule.kt
│   └── NetworkModule.kt
├── data/
│   ├── local/                   # Room Database, DAOs, Entities, DataStore Preferences
│   │   ├── KarvinDatabase.kt
│   │   ├── PreferencesManager.kt
│   │   ├── dao/                 # UserDao, JobDao, JobApplicationDao, ShiftDao, NotificationDao
│   │   └── entity/              # UserEntity, JobEntity, ShiftEntity, Converters, etc.
│   ├── remote/                  # Retrofit API Service interfaces & DTOs
│   ├── repository/              # Repository implementations & Persian Mock Data Seeder
│   └── mapper/                  # Entity <-> Domain mappers
├── domain/
│   ├── model/                   # Pure Kotlin models (User, WorkerProfile, Job, Shift, etc.)
│   ├── repository/              # Repository interfaces
│   └── usecase/                 # Auth, Worker, Employer, Notification Use Cases
├── presentation/
│   ├── theme/                   # Material 3 Persian Theme (Deep Blue & Opportunity Green, Dark mode)
│   ├── components/              # KarvinLogo, KarvinButton, KarvinTextField, JobCard, ShiftCard, etc.
│   ├── navigation/              # Navigation Compose route graph and bottom bar items
│   ├── splash/                  # Splash screen
│   ├── role_selection/          # Worker vs Employer role selection
│   ├── auth/                    # Login (OTP) & Multi-step Registration
│   ├── worker/                  # Worker Container, Home, Jobs, Shifts, Profile
│   ├── employer/                # Employer Container, Dashboard, Create Job, Applicants, Profile
│   ├── notifications/           # Notification center
│   └── common/                  # Settings, Profile edit
└── utils/                       # Persian date/currency formatters, Resource state wrapper
```

### Brand Palette:
- **Primary (Deep Blue / Trust)**: `#0F3460`, `#16213E`
- **Secondary (Opportunity Emerald / Growth & Earnings)**: `#059669`, `#10B981`
- **Accent (Teal / Connectivity)**: `#0284C7`, `#38BDF8`

---

## 🚀 Setup & Run Instructions

### Requirements:
- **Android Studio** (Koala / Jellyfish / Iguana or later)
- **JDK 17** (bundled with Android Studio)
- **Android SDK Platform 34** (minSdk: 26, targetSdk: 34)

### Opening in Android Studio:
1. Clone this repository on your MacBook or PC:
   ```bash
   git clone https://github.com/alifiroozii/KarVin.git
   ```
2. Open Android Studio.
3. Select **File > Open** and choose the `KarVin` directory.
4. Android Studio will automatically sync Gradle using the included Gradle Wrapper (`gradle-8.7`).
5. Select an Emulator (or connected physical device) and click **Run (Shift + F10)**.

### Building via Terminal:
- **macOS / Linux**:
  ```bash
  ./gradlew assembleDebug
  ```
- **Windows**:
  ```cmd
  gradlew.bat assembleDebug
  ```

---

## 🔮 Future Backend Integration
The application is pre-architected with Clean Architecture:
1. **Network Layer**: `KarvinApiService` and `AuthApiService` interfaces in `data/remote/api/` match REST endpoints.
2. **Repository Layer**: Replace the local database / fake repository calls with the Retrofit service in `AuthRepositoryImpl`, `JobRepositoryImpl`, etc.
3. **Authentication**: Swap the fake OTP generator with JWT token storage in `PreferencesManager` and bearer token interceptor in `NetworkModule`.
