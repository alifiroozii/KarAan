# Prompt 23 — Break & Overtime

## Break lifecycle

Breaks are Worker-owned attendance operations.

`CHECKED_IN -> ON_BREAK -> CHECKED_IN`

- Start/end are serialized with a PostgreSQL advisory transaction lock per assignment.
- A partial unique index on `breaks.assignment_id WHERE end_at IS NULL` prevents two active breaks.
- Break timestamps are durable source data; Timesheet calculation does not trust a client timer.
- GPS coordinates and optional accuracy are recorded as evidence together with AttendanceEvent and AuditLog.
- `break.max_count` defaults to 3.
- `break.max_total_minutes` defaults to the Shift break allowance.
- Exceeding the total allowance produces an auditable realtime warning rather than silently rewriting attendance.
- Paid/unpaid treatment is owned by TimesheetService.

## Overtime consent

Overtime is a contract between Employer and one Worker. Employer cannot extend a worker unilaterally.

Statuses:

`PENDING -> ACCEPTED | DECLINED | CANCELLED | EXPIRED`

Only the target Worker can accept or decline. Employer/Branch Manager/Business member scope is checked server-side before creation/cancellation.

Only one pending request may exist per assignment. A partial DB unique index plus advisory locks protect concurrent managers.

## Assignment-level effective end

Accepted overtime updates `shift_assignments.effective_end_at` inside the same transaction as acceptance.

This is intentionally not stored on the Shift: extending one worker in a multi-worker shift must not extend the others.

Sequential accepted extensions use the current effective end as their baseline.

## Rate models

Supported contracts:

- `NORMAL_RATE`: base hourly rate for accepted overtime minutes.
- `MULTIPLIER`: base hourly rate multiplied by basis points, currently validated between 1x and 3x.
- `FIXED_BONUS`: normal hourly overtime pay plus a fixed bonus, prorated if the Worker leaves before the accepted end.

Money uses bigint Rials. No floating-point money calculations are used.

## Timesheet integration

TimesheetService reads accepted overtime contracts directly from the database.

- Accepted worked overtime becomes `overtime_minutes` and `overtime_pay_rials`.
- Unpaid break overlap inside overtime is deducted from payable overtime.
- Time after scheduled end that is not covered by an accepted contract becomes `unapproved_overtime_minutes`.
- Unapproved overtime is never silently paid and moves the timesheet to `ADJUSTMENT_REQUIRED`.
- Time beyond the end of an accepted contract is also unresolved until reviewed.

This preserves Prompt 22's financial boundary: approval only reaches `READY_FOR_SETTLEMENT`; wallet/ledger movement remains Prompt 30/31.

## Expiration

A delayed BullMQ job is scheduled for every request. The worker calls the idempotent `expireOvertimeRequest()` domain action.

Lazy expiration is also enforced in read/respond paths. Therefore a temporary Redis/worker outage cannot make an expired request acceptable later.

## Realtime

Events emitted by the domain include:

- `worker.break_started`
- `worker.break_ended`
- `worker.break_limit_warning`
- `overtime.requested`
- `overtime.accepted`
- `overtime.declined`
- `overtime.cancelled`
- `overtime.expired`
- `assignment.updated`
- `timesheet.updated`

TanStack Query invalidation refreshes Worker current shift, break/overtime cards, employer live operations and timesheet details.

## UI

Worker current shift:

- real break timer from server timestamps
- start/end break using real GPS evidence
- overtime request card with Accept/Decline
- accepted effective end is visible
- checkout remains blocked while an active break exists

Employer live shift:

- request +30/+60/+120 minutes
- choose normal, multiplier or fixed-bonus terms
- see pending/accepted state
- cancel only while pending

Timesheet:

- accepted overtime and pay are shown separately
- unresolved overtime is highlighted and blocks approval
- accepted overtime contracts remain visible for auditability
