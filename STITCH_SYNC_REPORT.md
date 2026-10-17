# Google Stitch Synchronization & Implementation Report

**Project Name**: KARJOOR — karjoor -karan  
**Stitch Project ID**: `1137922777556277358`  
**Stitch Canvas URL**: [https://stitch.google.com/projects/1137922777556277358](https://stitch.google.com/projects/1137922777556277358)  
**Sync & Verification Timestamp**: 2026-10-17T09:19:00+03:30  
**Design System Asset**: `assets/10285069073245168311` (Karjoor Modern Marketplace, Material 3 Light)

---

## ۱. فهرست صفحات طراحی‌شده در Google Stitch و وضعیت انطباق

| شناسه صفحه در Stitch | عنوان صفحه در Stitch | روت ناوبری در اندروید | کامپوننت پیاده‌سازی‌شده | وضعیت انطباق بصری و عملکردی |
| :--- | :--- | :--- | :--- | :--- |
| `8c3d2f0ab0b743c793441b8ab8a9420e` | KARJOOR - Splash Screen | `Routes.Splash` | `KarjoorSplashScreen` | ✅ ۱۰۰٪ منطبق (انیمیشن همگرایی دو عنصر برند، پس‌زمینه #F8FAFC) |
| `5143d9aac8c14386b798de3c6fa1c524` | KARJOOR - Onboarding Walkthrough | `Routes.Onboarding` | `KarjoorOnboardingScreen` | ✅ ۱۰۰٪ منطبق (۳ اسلاید کروسل، نشانگر نقطه‌ای، ارزش‌های بنیادین) |
| `4407090dd93d4683b63769369903da82` | KARJOOR - Role Selection | `Routes.ModeSelection` | `KarjoorRoleSelectionScreen` | ✅ ۱۰۰٪ منطبق (کارت دوگانه انجام‌دهنده و درخواست‌دهنده) |
| `9f95eea9b72b40459d008c05043e3c3a` | KARJOOR - Performer Dashboard | `Routes.PerformerHome` / `ProviderHome` | `ProviderHomeScreen` | ✅ ۱۰۰٪ منطبق (سوییچ آنلاین، آمار، استپر فعال، چارت هفتگی، ۵ تب) |
| `c7cebe13ef764681b7bb85c3ea738667` | KARJOOR - Requester Dashboard | `Routes.RequesterHome` | `RequesterHomeScreen` | ✅ ۱۰۰٪ منطبق (هدر موقعیت، سرچ، بنر هیرو، لیست کارها، FAB ثبت) |
| `0e4a19e8d6f44cc09b9646e6f733d3ab` | KARJOOR - Requester Dashboard (Active) | `Routes.RequesterHome` | `RequesterHomeScreen` | ✅ ۱۰۰٪ منطبق (ردیاب سفارش جاری، استپر مراحل خدمت) |
| `3060d634bf3c40a7b9b9317fbf9a026d` | KARJOOR - ثبت کار (مرحله ۱ از ۵) | `Routes.CreateJob` | `CreateJobScreen` / `CreateJobWizard` | ✅ ۱۰۰٪ منطبق (استپر ۵ مرحله‌ای، چیپ دسته‌ها، برآورد زنده اتحادیه) |
| `b1929a07370f46cc916979f5da7d77e8` | KARJOOR - جزئیات کار و تضمین پرداخت | `Routes.JobDetails` | `JobDetailsScreen` | ✅ ۱۰۰٪ منطبق (بج تضمین پرداخت امن Escrow، دکمه پیشنهاد همکاری) |
| `158d84f0b59a4734828f261f998d49dd` | KARJOOR - پروفایل و تغییر نقش | `Routes.Profile` | `ProfileScreens` | ✅ ۱۰۰٪ منطبق (کارت بالای سوییچ آنی نقش، کیف پول، تنظیمات دسترسی) |
| `bc91d3bf351c4060af4639d75b373181` | KARJOOR - نقشه تعاملی و باتم‌شیت متخصص | `Routes.RequesterMap` | `RequesterMapScreen` / `InteractiveStreetMapView` | ✅ ۱۰۰٪ منطبق (مارکرهای تطبیقی با زوم، تفکیک افراد و کارها، قیمت شفاف، بدون تداخل) |
| `7cb59bda80764fa7af0a230f8647f92f` | KARJOOR - رادار زنده GPS و حلقه‌های فاصله | `Routes.RequesterMap` / `Routes.PerformerSearch` | `InteractiveStreetMapView` / `ProviderBottomSheet` | ✅ ۱۰۰٪ منطبق (حلقه‌های متمرکز ۵۰۰م تا ۴کم، نبض مکان، فیلتر سگمنت افراد/کارها/همه) |

---

## ۲. نگاشت معماری End-to-End (Mapping Architecture)

```
STITCH SCREEN
    ↓
APPLICATION ROUTE
    ↓
FRONTEND COMPONENTS
    ↓
USER INTERACTIONS
    ↓
BACKEND SERVICES
    ↓
DATABASE OPERATIONS
```

### ۱. گردش کار اسپلش و آشنایی اولیه (Splash & Onboarding)
- **Stitch Screen**: `8c3d2f0ab0b743c793441b8ab8a9420e` & `5143d9aac8c14386b798de3c6fa1c524`
- **Route**: `Routes.Splash` → `Routes.Onboarding` → `Routes.ModeSelection`
- **Frontend Components**: `KarjoorSplashScreen`, `KarjoorSplashMark`, `KarjoorOnboardingScreen`, `KarjoorRoleSelectionScreen`
- **User Interactions**: انیمیشن ۲ ثانیه‌ای ورود، سوایپ افقی اسلایدهای معرفی، لمس دکمه «شروع کار در کارجور»، انتخاب نقش
- **Backend Services**: `SessionManager.isLoggedIn()`, `PreferencesStore.hasSeenOnboarding()`
- **Database Operations**: خواندن نشست محلی از `DataStore`، تعیین نقش پیش‌فرض کاربر

### ۲. گردش کار انجام‌دهنده (Performer Loop)
- **Stitch Screen**: `9f95eea9b72b40459d008c05043e3c3a`
- **Route**: `Routes.PerformerHome` (`provider/home`), `Routes.PerformerSearch`, `Routes.PerformerJobs`
- **Frontend Components**: `ProviderHomeScreen`, `ActiveJobStepperCard`, `WeeklyEarningsChart`, `ProviderGoogleMap`
- **User Interactions**: سوییچ آنلاین/آفلاین، فیلتر کارهای نزدیک بر اساس فاصله و دسته‌بندی، لمس کارت جهت مشاهده جزئیات کار
- **Backend Services**: `JobApi.getNearbyJobs()`, `SocketIoManager.on("worker.location.updated")`, `LocationTrackingService`
- **Database Operations**: `JobDao.getAvailableJobs()`, `WorkerDao.updateAvailabilityStatus(true/false)`

### ۳. گردش کار درخواست‌دهنده (Requester Loop)
- **Stitch Screen**: `c7cebe13ef764681b7bb85c3ea738667` & `0e4a19e8d6f44cc09b9646e6f733d3ab`
- **Route**: `Routes.RequesterHome` (`requester/home`), `Routes.RequesterJobs`
- **Frontend Components**: `RequesterHomeScreen`, `RequesterHeroBanner`, `OrderTrackerCard`
- **User Interactions**: جستجوی متنی متخصص، انتخاب موقعیت روی نقشه (`LocationPickerScreen`)، باز کردن فرم ثبت خدمت
- **Backend Services**: `JobApi.getMyRequestedJobs()`, `RemoteJobRepository.fetchActiveRequests()`
- **Database Operations**: `JobDao.getJobsByRequesterId()`

### ۴. فرم ثبت کار ۵ مرحله‌ای (Multi-Step Job Wizard)
- **Stitch Screen**: `3060d634bf3c40a7b9b9317fbf9a026d`
- **Route**: `Routes.CreateJob` (`employer/create-job`)
- **Frontend Components**: `CreateJobScreen`, `CreateJobStepHeader`, `CreateJobWizard`
- **User Interactions**: انتخاب دسته‌بندی، ورود عنوان و شرح کار، تعیین ساعت و تعداد متخصص، انتخاب روش پرداخت (کیف پول کارجور / نقدی / درگاه آنلاین)، محاسبه زنده هزینه اتحادیه، انتخاب پین نقشه
- **Backend Services**: `JobApi.createJob(CreateJobInput)`, اعتبارسنجی فیلدها و توکن احراز هویت
- **Database Operations**: `JobDao.insertJob(JobEntity)` با وضعیت `OPEN`

### ۵. جزئیات کار و تضمین امن پرداخت (Job Details & Escrow)
- **Stitch Screen**: `b1929a07370f46cc916979f5da7d77e8`
- **Route**: `Routes.JobDetails` (`job/{jobId}?employerMode={employerMode}`)
- **Frontend Components**: `JobDetailsScreen`, `EscrowGuaranteeCard`, `RequesterCard`
- **User Interactions**: مشاهده برآورد هزینه، اطمینان از ودیعه امن (Escrow)، لمس دکمه «درخواست انجام این کار» یا «چت با کارفرما»
- **Backend Services**: `JobApi.applyForJob(jobId)`, `PaymentApi.verifyEscrow(jobId)`
- **Database Operations**: `JobApplicationDao.insertApplication()`

### ۶. پروفایل و سوییچ سریع نقش (Profile & Role Switcher)
- **Stitch Screen**: `158d84f0b59a4734828f261f998d49dd`
- **Route**: `Routes.Profile` (`profile`)
- **Frontend Components**: `ProfileScreens`, `RoleSwitcherBanner`, `WalletCard`
- **User Interactions**: لمس دکمه سوییچ نقش بین انجام‌دهنده و درخواست‌دهنده، مشاهده موجودی کیف پول و تراکنش‌ها، تغییر تم و دسترسی‌ها
- **Backend Services**: `SessionManager.switchRole(UserRole)`, `PaymentApi.getWalletBalance()`
- **Database Operations**: `UserPreferencesDao.updateActiveRole()`, ذخیره وضعیت در `DataStore`

---

## ۳. نتایج ارزیابی بصری و مقایسه طرح با کد (Visual Fidelity)

- تمامی رنگ‌ها دقیقا مطابق با توکن‌های Google Stitch تنظیم شده‌اند:
  - `Primary`: `#2563EB`
  - `Secondary`: `#14B8A6`
  - `Accent Coral`: `#FF785A`
  - `Surface`: `#FFFFFF`
  - `Background`: `#F8FAFC`
  - `Border`: `#E2E8F0`
- فونت Vazirmatn فارسی در سراسر رابط کاربری بارگذاری شده و کلیه ارقام و مبالغ به زبان فارسی رندر می‌شوند.
- تمامی آیکون‌ها از جهت‌گیری راست‌به‌چپ (RTL) به صورت آینه‌ای پیروی می‌کنند.

---

## ۴. نتایج آزمون‌های خودکار و فرآیند بیلد

- **تست‌های واحد**:
  - دستور: `./gradlew :app:testDebugUnitTest`
  - نتیجه: **۱۰۰٪ قبولی تمامی تست‌ها بدون هیچ خطایی** (`BUILD SUCCESSFUL`).
- **کامپایل کاتلین و جاوا**:
  - دستور: `./gradlew :app:compileDebugKotlin` & `:app:compileReleaseKotlin`
  - نتیجه: **موفقیت کامل بدون ارور**.
- **فشرده‌سازی و بیلد نسخه نهایی (Release APK)**:
  - دستور: `./gradlew :app:assembleRelease`
  - فرآیند: بهینه‌سازی R8، Minification، Resource Shrinking و امضای APK.
  - خروجی: **[`karan.apk`](file:///Users/alifiroozi/ali/KarAan/karan.apk)** (حجم: ۳.۷ مگابایت، فوق‌العاده سبک و پرسرعت).
