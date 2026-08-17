# Notifications — Prompt 33

## Scope

Prompt 33 adds KarAan's durable notification center and central external delivery pipeline.

Implemented channels:

- **IN_APP** — authoritative durable inbox; always enabled.
- **SMS** — delivered through the existing `ISMSAdapter` and controlled by user preference.
- **PUSH** — provider-ready contract only in this prompt. The default adapter explicitly reports `unavailable`; no push delivery is reported as successful until a real Web Push/FCM provider is connected.

## Source of truth

`NotificationService` is the only application-level creator of notification records.

A notification has:

- recipient user,
- type,
- title/body,
- structured data,
- idempotency key,
- read/read-at state,
- one delivery row per requested channel.

`notification_deliveries` is the delivery lifecycle source of truth. Channel status is one of:

`PENDING -> PROCESSING -> SENT | FAILED | SKIPPED`

The in-app delivery is recorded as `SENT` in the same database transaction that creates the notification. SMS and Push are queued after commit.

## Idempotency

Notification creation is serialized by PostgreSQL advisory lock on the idempotency key and protected by a unique database index. An exact retry returns the existing notification. Reusing the same key for another user/type fails with `409 CONFLICT`.

Each `(notification_id, channel)` pair is unique, preventing duplicate delivery rows.

## BullMQ delivery

`notification-delivery` owns SMS/Push execution.

- exponential retry, four attempts for direct jobs,
- five-minute recovery scan for `PENDING`, `FAILED`, or stale `PROCESSING` deliveries,
- a temporary Redis/queue failure never erases the durable in-app notification,
- stale processing claims become recoverable after ten minutes.

Workers are bootstrapped from `instrumentation.node.ts` together with the existing background workers.

## Preferences

`notification_preferences` currently controls:

- `smsEnabled` — default `true`,
- `pushEnabled` — default `false`.

In-app notifications cannot be disabled because operational actions must remain visible inside KarAan.

## Push boundary

Prompt 33 deliberately does not implement a fake push provider. `NoopPushAdapter` returns `unavailable: true`; the delivery is marked `SKIPPED / PUSH_PROVIDER_UNAVAILABLE`.

A later PWA/Web Push implementation can replace `getPushAdapter()` without changing notification creation, preferences, delivery persistence, retry logic, or UI.

## API

Authenticated, self-scoped endpoints:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `POST /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences`

No endpoint accepts a client-selected `userId` for reading or mutating another user's inbox.

## Realtime

After database commit:

- `notification.created`
- `notification.delivery.updated`

TanStack Query invalidates notification inbox/unread queries from these events.

## First production integration

Reconfirmation reminders now call `NotificationService` instead of directly constructing a `MockSMSAdapter`. The reminder is therefore durable in the user's inbox and SMS/Push follow the same preference, retry, and delivery audit path.

Other older direct SMS call sites remain behavior-compatible and can be migrated to `NotificationService` incrementally without introducing another notification store.

## UI

Both Worker and Employer surfaces expose `/notifications` pages through their existing layouts.

The shared notification center supports:

- real server-backed inbox,
- unread styling,
- mark one read,
- mark all read,
- SMS/Push preferences,
- explicit copy that Push is not reported as delivered until a real provider is connected.
