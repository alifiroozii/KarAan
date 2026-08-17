# Cancellation workflow (Prompt 24)

## Scope

Prompt 24 makes Worker and Employer cancellation an explicit, auditable Assignment workflow. It does **not** move money and it does **not** mutate Reliability scores yet.

## Lifecycle

Worker cancellation targets `CANCELLED_BY_WORKER`; Employer/Manager cancellation targets `CANCELLED_BY_EMPLOYER`.

Cancellation is only valid while the Assignment state machine allows the corresponding transition. Once attendance has started (`CHECKED_IN` / `ON_BREAK`), normal cancellation is rejected; early departure belongs to the attendance/timesheet workflow instead.

## API

`GET /api/assignments/:id/cancel` returns a server-calculated preview for the authenticated actor.

`POST /api/assignments/:id/cancel` accepts:

```json
{
  "reasonCode": "SICKNESS",
  "description": "optional explanation"
}
```

The server derives whether the actor is the Worker side or Employer side from Assignment ownership and object-level management authorization. Clients cannot choose the cancellation side.

## Policy

Policies are read from `system_settings`:

- `cancellation.worker_policy`
- `cancellation.employer_policy`

Each policy contains `lateThresholdHours` and ordered `tiers`. A tier supports:

- `maxHoursBeforeStart`
- `penaltyBps`
- `workerCompensationBps`
- `scoreImpact`

The default values in code are bootstrap defaults and can be replaced without redeploying.

## Financial safety

The service calculates and stores:

- `penaltyRials`
- `workerCompensationRials`

but never debits or credits a Wallet/Ledger. `policySnapshot.monetarySettlementDeferred=true` records this boundary. Actual financial application belongs to the finance/settlement prompts and must be idempotent there.

## Reliability safety

`scoreImpact` is stored as the policy outcome but Prompt 24 does not change Worker or Employer reliability/trust scores. The Reliability Engine prompt consumes the authoritative event later.

## Atomicity and idempotency

Cancellation uses a PostgreSQL advisory transaction lock per Assignment and a unique index on `cancellations.assignment_id`.

Inside the same transaction the service:

1. re-reads the Assignment,
2. validates the state transition,
3. updates the Assignment with compare-and-set semantics,
4. re-opens the related Shift slot,
5. inserts the Cancellation record,
6. inserts AuditLog.

A retry returns the already-created cancellation instead of creating a duplicate.

## Realtime

After commit the service publishes existing typed events:

- `assignment.updated` to Assignment and Shift rooms,
- `assignment.updated` to the Worker user room,
- `assignment.updated` to the Employer owner when the Worker cancelled,
- `shift.updated` to the Shift room.

No success event is emitted before the database transaction commits.

## Backfill boundary

Prompt 24 only re-opens the Shift slot. It does not implement replacement matching. Prompt 26 owns Backfill behavior.
