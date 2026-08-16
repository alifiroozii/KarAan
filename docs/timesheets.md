# Prompt 22 — Timesheet Engine

## Source of truth

Attendance records presence events only. `TimesheetService` is the public domain boundary for calculating, reviewing and disputing timesheets. The implementation reads durable `attendance_events` and `breaks`; client-provided hours are never trusted.

## Checkout integration

A successful secure checkout first commits `CHECK_OUT` and the assignment state. After that, `TimesheetService.createOrGetForAssignment()` creates the timesheet. If calculation fails after attendance was committed, retrying checkout is safe: the idempotent checkout path calls `createOrGetForAssignment()` again.

A unique index on `timesheets.assignment_id` and a PostgreSQL advisory transaction lock prevent duplicate timesheets.

## Calculation

- Gross minutes: actual check-out minus actual check-in.
- Break duration is derived from break timestamps rather than trusting cached duration fields.
- Paid breaks remain payable; unpaid breaks reduce payable minutes.
- The hourly rate is snapshotted on the timesheet in Rials.
- Monetary arithmetic uses bigint and deterministic integer rounding.
- `timesheet.rounding_increment_minutes` supports 1, 5 or 15 minute rounding; the default is 1 minute.
- Time after scheduled end is surfaced as overtime but is not silently paid before an explicit overtime agreement exists. Prompt 23 owns that agreement workflow.

## Lifecycle

`SUBMITTED` → `READY_FOR_SETTLEMENT` after employer approval.

`ADJUSTMENT_REQUIRED` is used when unapproved overtime exists and blocks approval.

`DISPUTED` records a worker/employer dispute. `SETTLED` is reserved for the later ledger/payment flow. `VOID` is terminal.

Legacy `APPROVED` rows remain supported for migration compatibility and can move to `READY_FOR_SETTLEMENT`.

## Financial boundary

Prompt 22 never credits a wallet. The previous `SettlementService.approveTimesheet()` direct-balance mutation is disabled because it used non-atomic balance updates and a time-based idempotency key. Approval now records metadata and moves the timesheet to `READY_FOR_SETTLEMENT`. Prompt 30/31 will perform provider settlement and ledger-safe wallet accounting.

## Authorization

Workers may only read their own timesheets. Employers, branch managers and business members are object-scoped to their own shift/business/branch. Approval requires `timesheet.approve`; disputes require `timesheet.dispute`.

## APIs

- `GET /api/worker/timesheets`
- `GET /api/employer/timesheets`
- `GET /api/timesheets/:id`
- `POST /api/timesheets/:id/approve`
- `POST /api/timesheets/:id/dispute`

List endpoints support pagination; employer lists also support branch and worker filters.

## Database migration safety

Migration `0005_timesheet_engine.sql` adds the lifecycle fields and unique assignment index. It deliberately aborts if historical duplicate timesheets exist instead of silently deleting financial records.
