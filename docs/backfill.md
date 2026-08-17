# Backfill workflow

Prompt 26 turns a final vacancy into an auditable urgent replacement flow.

## Triggers

Automatic triggers:

- final `NO_SHOW`
- `CANCELLED_BY_WORKER`
- `CANCELLED_BY_EMPLOYER`

The primary trigger is the actual `assignment.updated` realtime event. A BullMQ recovery scan also runs every minute and discovers final no-show/cancellation vacancies that have an `OPEN` slot but no Backfill Request. This provides eventual recovery if a process, Redis connection or realtime handoff was temporarily unavailable.

## Backfill Request

Each source vacancy produces at most one `backfill_requests` record. Only one active request may exist for a slot at a time.

Lifecycle:

`REQUESTED -> DISPATCHING -> OFFERED -> FILLED`

Terminal alternatives:

- `EXHAUSTED`: dispatch attempts reached the configured maximum without a fill.
- `CANCELLED`: the source vacancy was restored, for example after a no-show override.

Policy is read from `system_settings.key = backfill.policy` and snapshotted into the request:

- `maxCandidates` (default 8)
- `maxDistanceKm` (default 35)
- `offerTtlSeconds` (default 300)
- `maxDispatchAttempts` (default 3)
- `retryDelaySeconds` (default 90)
- `urgentBonusRials` (default 0)

## Matching and offers

Backfill reuses the canonical MatchingService. It excludes:

- the source/cancelled Worker
- Workers already assigned to the Shift
- Workers already offered the same Slot

Offers are short-lived and linked to the Backfill Request through `backfill_offer_links`. Candidate Workers receive a realtime `offer.created` event and an SMS reminder.

The Worker dashboard displays active offers and marks Backfill offers as urgent. If configured, the fixed urgent bonus is visible before acceptance.

## Atomic acceptance

Offer acceptance is protected by a PostgreSQL advisory lock on the Slot and runs in one database transaction:

1. validate Offer ownership/status/expiry
2. consume `OPEN -> FILLED` Slot
3. create the new Assignment
4. copy Backfill urgent bonus into `shift_assignments.agreed_bonus_rials`
5. accept the winning Offer
6. expire sibling pending Offers for the Slot
7. mark Backfill Request `FILLED`
8. write AuditLog records

Only one Worker can consume the Slot. A retry of the winning accepted Offer is idempotent when its Assignment already exists.

## Contract bonus and Timesheet

`agreed_bonus_rials` is contractual Assignment data, not a Wallet credit.

TimesheetService synchronizes this amount into the final Timesheet calculation after creation/recalculation:

`final = calculated pay + regular/overtime bonus + agreed contract bonus - deductions`

The API exposes total bonus including the Backfill incentive. Prompt 26 does not touch Wallet, Ledger, PaymentProvider, payout or settlement.

## Realtime

Events:

- `backfill.requested`
- `backfill.offers_dispatched`
- `backfill.filled`
- `backfill.exhausted`
- `backfill.cancelled`

Employer live operations display Backfill status, dispatch attempt count, number of offers and urgent bonus.

## No-show override safety

If a final no-show is overridden while a Backfill is still active, its pending offers are expired and the Backfill Request becomes `CANCELLED`. This prevents a restored Worker and a replacement Worker from both owning the same vacancy.

## Financial boundary

No money movement occurs in this Prompt. The urgent bonus only becomes part of the approved Timesheet amount. Prompts 30–32 remain authoritative for payment reservation, Wallet/Ledger mutations, settlement and payout.
