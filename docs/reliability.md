# Reliability Engine

Prompt 27 establishes Reliability as an operational trust score, separate from Quality Rating.

## Domain boundary

Quality Rating (1–5 stars, tags and review comments) does **not** mutate Reliability.

Reliability changes only through the authoritative `ReliabilityService` from operational events such as:

- final no-show
- worker cancellation / late cancellation
- completed assignment
- future punctuality / late-arrival / early-leave rules
- audited admin adjustment
- reversal of an earlier Reliability event

## Versioned event ledger

Every score mutation creates a `reliability_events` record containing:

- unique idempotency key
- Worker and optional Assignment
- event type
- source type/id
- policy version
- requested/applied score delta
- previous score
- resulting score
- reason / metadata
- reversal linkage

Workers are serialized with a PostgreSQL advisory lock (`reliability:<workerId>`) so concurrent events cannot lose score updates.

The score is clamped to the configured min/max range (default 0–100).

## Policy

`system_settings.key = reliability.policy`

Default v1 values:

- score bounds: 0–100
- completed Shift: +0.5
- punctual bonus hook: +0.5
- fallback no-show penalty: -25
- fallback late cancellation: -10
- strike expiry: 90 days
- automatic suspension: active strike weight >= 3
- suspension duration: 3 days
- permanent ban: disabled by default; configurable threshold

No-show and Cancellation use their own snapshotted penalty/score-impact when available, preserving the policy that was active when the operational event happened.

## No-show integration

A `FINAL` no-show creates an idempotent negative Reliability event and optional Strike according to the No-show snapshot.

If the No-show is later `OVERRIDDEN`, the original Reliability event is reversed through a new `REVERSAL` event. The original event remains in history and is marked reversed. Its active Strike is revoked.

This avoids silently rewriting score history.

## Cancellation integration

Only Worker-side cancellations affect Worker Reliability. Employer cancellation never penalizes the Worker.

Prompt 24's snapshotted `scoreImpact` is the source of truth. Late/high-impact cancellations may create a Strike.

## Completion

A completed Assignment creates one idempotent positive event using the current Reliability policy version.

## Strikes

Strikes are linked to the Reliability event that created them and have:

- unique idempotency key
- active/expired/revoked status
- configurable expiry
- weight

Automatic sanctions are evaluated using total active strike weight.

## Sanctions

Supported sanction types:

- temporary suspension
- permanent ban
- shift restriction

A suspension/ban is not cosmetic. Active sanctions are enforced at three boundaries:

1. Worker cannot switch Availability into a work-eligible state.
2. Matching excludes the Worker.
3. A previously issued Offer cannot be accepted after the sanction becomes active.

Temporary sanctions automatically become expired after their end time when checked. Automatic sanctions may be revoked when the Reliability event/Strike that justified them is reversed and the active strike weight falls below the policy threshold.

## Background processing

`reliability.queue.ts` listens to actual domain realtime events:

- `no_show.finalized`
- `no_show.overridden`
- `assignment.updated` for Worker cancellation
- `assignment.updated` for completion

A BullMQ recovery scan runs every five minutes and safely reprocesses recent source records. Event idempotency prevents duplicate score mutation.

## APIs

Worker:

`GET /api/worker/reliability`

Admin/support read:

`GET /api/admin/workers/[id]/reliability`

Admin adjustment:

`POST /api/admin/workers/[id]/reliability`

Manual adjustment requires a caller-provided idempotency key, non-zero delta and reason. Only Admin/Super Admin can mutate.

## Realtime

- `reliability.updated`
- `strike.created`
- `sanction.created`
- `sanction.revoked`

The Worker dashboard uses the real Reliability API and displays active strike weight and sanction state.
