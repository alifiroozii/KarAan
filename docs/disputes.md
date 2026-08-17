# Dispute Resolution — Prompt 34

Prompt 34 turns the previous `DISPUTED` timesheet flag into an auditable production dispute workflow.

## Lifecycle

`OPEN -> UNDER_REVIEW -> RESOLVED | REJECTED`

- Worker/Employer-side actors with `dispute.create` may open one active dispute per Assignment.
- Opening a dispute atomically moves the Timesheet to `DISPUTED`.
- `DISPUTE_AGENT`, `ADMIN`, and `SUPER_ADMIN` can review and resolve through `dispute.manage`.
- `REQUIRE_ADJUSTMENT` resolves the dispute and moves the Timesheet to `ADJUSTMENT_REQUIRED`.
- `REJECT_DISPUTE` rejects the dispute and safely returns the Timesheet to `SUBMITTED`.

## Financial boundary

A disputed Timesheet cannot enter settlement. Existing approval rules already reject `DISPUTED` and `ADJUSTMENT_REQUIRED`; settlement continues to require the canonical settlement-ready state. Resolution clears previous approval/ready timestamps before returning a Timesheet to an editable/reviewable state.

No Wallet, Ledger, Escrow, or payout mutation happens inside the dispute service.

## Concurrency and idempotency

Opening/review/resolution paths use PostgreSQL advisory transaction locks. Re-opening an Assignment with an active `OPEN`/`UNDER_REVIEW` case returns the same dispute. Review and terminal resolution are idempotent for safe retries.

## Authorization

- `dispute.create`: Worker/Employer/Branch-side creation after object-level Assignment access checks.
- `dispute.view`: self/business/branch scoped visibility, plus support/admin roles.
- `dispute.manage`: dedicated dispute/admin roles only.

The client cannot select another user, Worker, Employer, Assignment, or financial owner.

## Audit and realtime

Every lifecycle mutation writes `audit_logs` and publishes `dispute.updated` to the Assignment and relevant user rooms. User-facing status changes are also written to the durable Prompt 33 notification center using `SYSTEM_ANNOUNCEMENT` with `data.subtype = DISPUTE`.

## API

- `POST /api/timesheets/:id/dispute` — open an idempotent dispute for a Timesheet
- `GET /api/disputes` — actor-scoped dispute center
- `POST /api/disputes/:id/review` — start review (`dispute.manage`)
- `POST /api/disputes/:id/resolve` — `REQUIRE_ADJUSTMENT` or `REJECT_DISPUTE`

## UI

Worker and Employer layouts expose an **اختلافات** destination. The same server-backed `DisputeCenter` component supports user visibility and management actions when the authenticated role has `dispute.manage`.
