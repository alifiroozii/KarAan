# No-show lifecycle

Prompt 25 introduces a two-stage, auditable no-show workflow.

## Lifecycle

Eligible assignment states:

- `RECONFIRM_PENDING`
- `CONFIRMED`
- `EN_ROUTE`
- `ARRIVED`

Default policy (`system_settings.key = no_show.policy`):

- grace period: 10 minutes after scheduled start
- final threshold: 20 minutes after scheduled start
- reliability penalty snapshot: 25 points
- strike recommended: true

The policy is configurable. The final threshold is always normalized to be later than the grace period.

### POTENTIAL

At/after the grace period, if attendance has not started, a `no_show_events` row is created with `POTENTIAL` status. The assignment state is intentionally unchanged so the Worker can still arrive/check in before the final threshold.

The Worker receives an SMS warning and realtime `no_show.potential` is published to the assignment/shift/user rooms.

If the Worker reaches an attendance state before finalization (`CHECKED_IN`, `ON_BREAK`, `CHECKED_OUT`, `COMPLETED`, `LEFT_EARLY`), the potential event is automatically resolved to `OVERRIDDEN` with an audit entry.

### FINAL

At/after the final threshold, an eligible assignment transitions to `NO_SHOW` atomically under a PostgreSQL advisory lock. The slot is reopened and the event becomes `FINAL`.

Realtime events:

- `no_show.finalized`
- compatibility event `no_show.detected`
- `assignment.updated`
- `backfill.requested` (hook only; Prompt 26 owns actual replacement logic)

The Worker receives a final SMS notification.

## Reliability boundary

Prompt 25 records:

- `reliabilityPenalty`
- `strikeRecommended`

It does **not** mutate the Worker reliability score, create strikes, suspend users, or ban accounts. Prompt 27 is the authoritative Reliability Engine and will consume these records idempotently.

## Override

Support/Dispute/Admin roles can override a potential/final no-show with a required reason.

For a final no-show, the assignment is restored to its recorded pre-no-show state only when its original slot is still `OPEN`. If a future backfill has already filled the slot, automatic restoration is rejected as a conflict to prevent double assignment.

Endpoint:

`POST /api/assignments/[id]/no-show/override`

Manual operational scan (Admin/Super Admin):

`POST /api/admin/no-show/scan`

## Background processing

`src/instrumentation.ts` initializes a BullMQ worker in the Node.js runtime. The queue uses a BullMQ Job Scheduler with a stable scheduler id and scans once per minute. Multiple app instances can safely call scheduler upsert without creating duplicate schedules.

The detector itself is idempotent and protected with PostgreSQL advisory locks, so retries or concurrent workers do not create duplicate no-show records.
