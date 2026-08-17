# Escrow, Settlement & Payout Preparation — Prompt 32

## Financial boundary

Prompt 32 extends the authoritative Wallet Ledger introduced in Prompt 31. No business service may mutate `wallets.available_rials` or `wallets.locked_escrow_rials` without an immutable `wallet_transactions` entry in the same database transaction.

Legacy `employer_profiles.wallet_balance_rials` and `locked_escrow_rials` are not financial sources of truth.

## Two Wallet balance buckets

Each Wallet now has two reconciled buckets:

- `AVAILABLE`: spendable or withdrawable balance.
- `LOCKED_ESCROW`: money reserved for published shifts and unavailable for other spending.

Every Ledger row identifies the bucket it affects.

### Escrow lock

Locking a shift reserve is represented by two immutable entries:

1. `DEBIT AVAILABLE / ESCROW_LOCK`
2. `CREDIT LOCKED_ESCROW / ESCROW_LOCK`

The total Wallet value does not disappear; it moves from spendable balance into the escrow bucket.

### Escrow release

Unused reserve is returned with the inverse pair:

1. `DEBIT LOCKED_ESCROW / ESCROW_RELEASE`
2. `CREDIT AVAILABLE / ESCROW_RELEASE`

Release is permitted only when every payable assignment for the Shift has been settled/voided or has reached a terminal no-pay state.

## Shift publication transaction

The old Shift API called a legacy fail-closed finance method before inserting the Shift, which made Shift creation unusable after Prompt 31.

Prompt 32 replaces that path with one transaction:

```text
validate Shift request + Idempotency-Key
  -> create PUBLISHED Shift
  -> calculate employer fee reserve
  -> DEBIT employer AVAILABLE
  -> CREDIT employer LOCKED_ESCROW
  -> create shift_escrows policy snapshot
  -> AuditLog
COMMIT
```

If the employer does not have enough AVAILABLE balance, the entire transaction rolls back and the Shift is not created.

Matching dispatch happens only after the financial transaction commits. A matching failure does not roll back money or encourage a duplicate financial retry.

## Fee policy

System settings:

```text
settlement.employer_fee_bps = 1500
settlement.worker_commission_bps = 0
```

`1500` basis points means 15%. Worker commission is currently 0%.

A Shift Escrow snapshots both rates when it is funded so later global setting changes do not retroactively alter an already-funded Shift.

Money calculations use integer Rials and deterministic basis-point arithmetic. No JavaScript floating-point money is persisted.

Employer fee amounts use integer ceiling division to avoid under-reserving a fractional Rial.

## Initial reserve

For a Shift with worker budget `B` and employer fee rate `F`:

```text
feeReserve = ceil(B * F / 10000)
totalReserve = B + feeReserve
```

Example:

```text
worker budget: 10,000,000 Rials
employer fee: 15%
fee reserve: 1,500,000 Rials
total escrow: 11,500,000 Rials
```

Worker commission is deducted from worker gross, not added to employer cost. With the current 0% policy, worker net equals worker gross.

## Timesheet approval vs Settlement

These are deliberately separate operations.

### Approval

Existing Timesheet approval ends at:

```text
READY_FOR_SETTLEMENT
```

It does not mutate Wallet or Ledger state.

Branch Managers / Shift Supervisors may have operational Timesheet approval permission, but they do not automatically receive financial settlement permission.

### Settlement

Endpoint:

```text
POST /api/timesheets/:id/settle
```

Required permission:

```text
payment.settle
```

Allowed financial actors:

- owning Employer,
- `FINANCE_ADMIN`,
- `ADMIN`,
- `SUPER_ADMIN`.

The service separately verifies object ownership for a normal Employer.

Only `READY_FOR_SETTLEMENT` Timesheets can settle.

## Atomic Settlement transaction

Settlement is serialized by Timesheet id with a PostgreSQL advisory transaction lock.

For a Timesheet gross amount `G`:

```text
workerCommission = ceil(G * workerCommissionBps / 10000)
workerNet = G - workerCommission
employerFee = ceil(G * employerFeeBps / 10000)
requiredEscrow = G + employerFee
```

Then one database transaction performs:

```text
validate Timesheet + Assignment + Shift + ownership
  -> load/create Shift Escrow policy snapshot
  -> lock any settlement shortfall from Employer AVAILABLE if required
  -> DEBIT Employer LOCKED_ESCROW for Worker net
  -> DEBIT Employer LOCKED_ESCROW for platform revenue
  -> CREDIT Worker AVAILABLE for Worker net
  -> update shift_escrows totals
  -> create unique settlements row
  -> Timesheet -> SETTLED
  -> Assignment -> COMPLETED through the official state machine
  -> AuditLog
COMMIT
```

Realtime events are published only after commit.

If any Ledger write, constraint, ownership check, state transition or balance check fails, the entire local transaction rolls back.

## Overtime / settlement shortfall

An approved Timesheet can exceed the original Shift reserve because of accepted overtime or other valid final-pay adjustments.

Prompt 32 does not silently underpay the Worker. Before settlement, the service calculates the required amount. If Escrow is short, it atomically moves the shortfall from Employer `AVAILABLE` to `LOCKED_ESCROW`.

If the Employer does not have sufficient AVAILABLE balance, Settlement fails with `INSUFFICIENT_FUNDS`; no partial Worker credit is produced.

## Settlement idempotency

Protection layers include:

1. advisory lock per Timesheet,
2. unique `settlements.timesheet_id`,
3. unique `settlements.assignment_id`,
4. deterministic Ledger idempotency keys,
5. partial unique index allowing at most one successful Worker `SETTLEMENT/CREDIT/AVAILABLE` row per Timesheet reference.

A repeated settlement returns the existing Settlement instead of paying the Worker again.

## Escrow APIs

Read Shift Escrow:

```text
GET /api/shifts/:id/escrow
```

Release unused remainder after all payable work is closed:

```text
POST /api/shifts/:id/escrow/release
```

Both routes apply object-level authorization. Release additionally requires `payment.settle`.

## Payout preparation

Prompt 32 prepares withdrawal safely but deliberately does **not** claim that a bank transfer has occurred.

Endpoint:

```text
POST /api/payouts
Idempotency-Key: ...
```

Worker requirements:

- verified Worker profile,
- valid Iranian IBAN (`IR` + 24 digits),
- sufficient AVAILABLE Wallet balance,
- minimum payout amount.

A successful request performs:

```text
DEBIT Worker AVAILABLE / WITHDRAWAL
  -> create PENDING payout row linked to that Ledger entry
  -> AuditLog
COMMIT
```

This reserve prevents the same Wallet balance from being spent or requested for withdrawal twice while bank processing is pending.

`GET /api/payouts` lists the authenticated Worker's recent requests.

### Bank execution is deferred

Prompt 32 does not call a banking/payout provider. A `PENDING` payout is not a completed transfer. Future payout execution must:

- transition `PENDING -> PROCESSING -> DONE` only after provider confirmation,
- store tracking/reference numbers,
- remain idempotent,
- on definitive rejection, post a compensating Ledger CREDIT before marking the request `REJECTED`,
- never directly rewrite historical Ledger rows.

## Reconciliation

`WalletLedgerService.reconcileProjection()` now independently reconciles both buckets:

- AVAILABLE Ledger sum vs `wallets.available_rials`,
- LOCKED_ESCROW Ledger sum vs `wallets.locked_escrow_rials`.

It reports drift and does not silently repair financial data.

## Realtime

`wallet.updated` is emitted after committed changes for:

- Escrow lock,
- Escrow release,
- Settlement,
- Payout reservation.

Settlement also publishes Timesheet/Assignment updates after commit.

## Security properties

- no floating-point persisted money,
- no client-provided actor/user id for Wallet or Payout ownership,
- object-level Employer ownership checks,
- separate operational approval and financial settlement permissions,
- advisory locks around financially retryable workflows,
- deterministic idempotency keys,
- immutable Ledger history,
- AuditLog without raw banking secrets,
- UI never reports a PENDING Payout as a completed bank transfer.
