# KARVIN Android

KARVIN (کاروین) یک اپلیکیشن Native Android برای ارتباط کارگر و کارفرما در بازار کار ساعتی، روزانه، پروژه‌ای و خدماتی است. نسخه فعلی با داده‌های fake و local-first قابل اجراست و مرزهای Repository برای اتصال به backend واقعی آماده شده‌اند.

## Architecture

The app follows a pragmatic Clean Architecture layout:

- `domain/model`: business entities, workflow states, filters, and distance calculations
- `domain/repository`: contracts consumed by ViewModels
- `domain/usecase`: filtering and business rules
- `data/repository`: fake offline repositories and shared StateFlow store
- `data/database`: Room cache entities and DAO
- `data/PreferencesStore`: DataStore-backed onboarding, role, theme, and auth state
- `core/designsystem`: Persian RTL Material 3 theme and reusable UI components
- `core/location`: Fused Location Provider and independent location states
- `core/notification`: Firebase Cloud Messaging service boundary
- `core/sync`: WorkManager periodic cache sync boundary
- `feature/*`: screen, UiState, UiEvent, and ViewModel implementations

UI code never calls a DataSource directly. ViewModels depend on domain repository interfaces and are provided with Hilt.

## Technology

- Kotlin 2.2.21 and Gradle Kotlin DSL
- Jetpack Compose, Material 3, Navigation Compose
- MVVM, Clean Architecture, Coroutines, StateFlow
- Hilt dependency injection
- Room and DataStore for offline persistence
- Retrofit, Gson, OkHttp, and logging interceptor
- Google Maps Compose with a no-key offline map fallback
- FusedLocationProviderClient
- WorkManager
- Coil Compose
- Firebase Cloud Messaging service boundary

## Setup

1. Open the `android` directory in Android Studio.
2. Use JDK 17 and Android SDK platform 36.
3. Create `android/local.properties` locally if Android Studio does not create it:

```properties
sdk.dir=/absolute/path/to/Android/Sdk
```

4. Optional: add a Google Maps key locally, never to Git:

```properties
MAPS_API_KEY=your-local-key
```

The key is read from `local.properties` or a Gradle property and exposed only through `BuildConfig`. When it is empty, the app uses an interactive offline marker/list surface instead of crashing.

## Run

From `android`:

```bash
./gradlew installDebug
```

The first launch presents Splash, onboarding, phone sign-in, and role selection. Authentication is intentionally fake and persists its state in DataStore.

## Build and checks

```bash
./gradlew clean
./gradlew assembleDebug
./gradlew test
./gradlew lint
```

The unit suite covers distance calculation, Persian formatting, job filtering, fake repository workflow, and Jobs ViewModel behavior. `NavigationSmokeTest` launches the main activity with AndroidX test infrastructure.

## Feature list

- Persian RTL onboarding, sign-in, role selection, and persisted role switching
- Worker home with availability presence toggle and nearby job feed
- Employer dashboard with active, applicant, in-progress, and completed counters
- Job search, category and distance filters, price/rating/urgent filters, save job
- Job details, application submission, employer applicant list, and create-job form
- Workflow progression from open/application through accepted, en-route, arrived, in-progress, completed, and rated
- Worker map and employer worker map with Google Maps markers when configured
- Offline map fallback with nearby cards when no Maps API key is available
- Worker profiles, verification, skills, completed work, rating and reviews
- Chat list and message threads with timestamps, seen state, loading and empty states
- Notification center with read/unread state and FCM service boundary
- Profile, earnings summary, theme mode, role switching, and sign out
- Room cache boundaries for jobs, workers, messages, and favorites
- Location permission explanation and Fused Location state model

## Fake data

The data layer seeds:

- 30 workers
- 30 employers
- 50 jobs
- applications across multiple statuses
- conversations and messages
- worker reviews
- notifications

Seed data lives in `data/FakeData.kt`; it is not embedded in Compose screens.

## Backend integration plan

1. Replace fake repository implementations with Retrofit-backed implementations while keeping the domain interfaces stable.
2. Add access-token storage and refresh handling behind an auth data source.
3. Replace local distance filtering with backend geo queries using the current `GeoPoint` and filter contracts.
4. Persist API DTOs separately from domain models and map them in the data layer.
5. Replace StateFlow mock chat transport with WebSocket or Socket.IO while keeping `ChatRepository` unchanged.
6. Persist FCM registration tokens and route server events into the notification repository.
7. Add server-authoritative application/workflow transitions, idempotency keys, and audit events.
8. Add real map geocoding, exact location selection, privacy controls, and background location policy only where legally required.
9. Add production authentication, profile verification, moderation, payments, analytics, crash reporting, and secure secret management.

## Security notes

No API key or backend secret is committed. `local.properties`, build output, Gradle caches, and generated files are ignored by the repository. The demo uses fake authentication and must not be treated as production authentication until the backend integration is complete.
