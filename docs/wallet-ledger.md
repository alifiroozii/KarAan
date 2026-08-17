# Wallet Ledger — Prompt 31/32

## Principle

`wallet_transactions` is KarAan's financial source of truth. `wallets` is only a read-optimized balance projection. Business code must never mutate a Wallet balance without producing the corresponding immutable Ledger entry in the same database transaction.

Legacy balance fields on domain profiles are deprecated financial data and are not authoritative.

## Balance buckets

Prompt 32 makes the two Wallet projections explicit Ledger buckets:

- `AVAILABLE`: spendable/withdrawable balance.
- `LOCKED_ESCROW`: money reserved for Shift obligations.

Each Ledger entry records its bucket and `balanceAfterRials` is the balance of that bucket after posting.

`WalletLedgerService.reconcileProjection(userId)` independently reconciles both buckets and reports drift; it never silently rewrites financial history.

## Exactly-once Payment top-up

A successful `WALLET_TOPUP` Payment is identified by Payment id.

```text
wallet:payment-credit:<paymentId>
```

Protection layers:

1. globally unique Ledger idempotency key,
2. partial unique index permitting only one successful `TOPUP/CREDIT/AVAILABLE` entry per Payment reference,
3. callback advisory lock,
4. serialized Wallet creation,
5. Wallet row lock before posting.

Payment verification and Wallet credit remain one local database transaction:

```text
Provider verify succeeds
  -> Payment SUCCESS
  -> Ledger CREDIT / AVAILABLE / TOPUP
  -> Wallet AVAILABLE projection
  -> Payment.walletId linkage
  -> AuditLog
  -> callback receipt processed
COMMIT
```

## Generic Ledger posting

All financial mutations now pass through `WalletLedgerService.postEntryInTransaction()` or a domain-specific wrapper around it.

Posted amounts are always positive `bigint` Rials. Direction determines the sign:

- `CREDIT`: increases the selected bucket.
- `DEBIT`: decreases the selected bucket.

A DEBIT that would make the selected bucket negative fails with `INSUFFICIENT_FUNDS` and the surrounding transaction rolls back.

## Prompt 32 transaction types

### Escrow lock

```text
DEBIT AVAILABLE / ESCROW_LOCK
CREDIT LOCKED_ESCROW / ESCROW_LOCK
```

### Escrow release

```text
DEBIT LOCKED_ESCROW / ESCROW_RELEASE
CREDIT AVAILABLE / ESCROW_RELEASE
```

### Timesheet settlement

Employer:

```text
DEBIT LOCKED_ESCROW / SETTLEMENT
DEBIT LOCKED_ESCROW / PLATFORM_FEE
```

Worker:

```text
CREDIT AVAILABLE / SETTLEMENT
```

Exactly one successful Worker Settlement credit is allowed per Timesheet reference.

### Payout preparation

```text
DEBIT AVAILABLE / WITHDRAWAL
```

The debit reserves the requested money while the Payout row is `PENDING`. It does not mean a bank transfer has completed.

## Database constraints

The schema enforces:

- Wallet AVAILABLE >= 0,
- Wallet LOCKED_ESCROW >= 0,
- Ledger amount > 0,
- Ledger balance-after >= 0,
- one successful TOPUP credit per Payment,
- one successful Worker Settlement credit per Timesheet,
- one Shift Escrow per Shift,
- one Settlement per Timesheet and Assignment,
- payout idempotency and one Ledger reservation per Payout.

## APIs

Wallet summary:

```text
GET /api/wallet
```

Wallet history:

```text
GET /api/wallet/transactions?limit=25&cursor=...
```

History now exposes `bucket` so UI can distinguish AVAILABLE movement from Escrow movement.

Shift Escrow:

```text
GET /api/shifts/:id/escrow
POST /api/shifts/:id/escrow/release
```

Settlement:

```text
POST /api/timesheets/:id/settle
```

Payout preparation:

```text
POST /api/payouts
GET /api/payouts
```

All user-owned routes derive ownership from the authenticated session; they do not accept a client-selected Wallet owner.

## Realtime

Committed Wallet changes emit `wallet.updated` with:

- Wallet id,
- actual user id,
- AVAILABLE and LOCKED_ESCROW projections,
- Ledger transaction id,
- typed reason.

Events are published only after the database transaction commits.

## Legacy finance paths

`FinanceService.lockEscrow()` and `FinanceService.settleAssignment()` remain fail-closed. They are not re-enabled because they bypass the authoritative Ledger design.

`SettlementService.approveTimesheet()` also remains fail-closed. Operational Timesheet approval and financial Settlement are deliberately separate actions and permissions.

## UI

Employer:

- real Wallet balance and bucket-aware history,
- Shift publication locks Escrow atomically,
- `READY_FOR_SETTLEMENT` Timesheet exposes a separate Settlement action.

Worker:

- real Wallet balance and history,
- settled Shift earnings appear as Ledger credit,
- Payout request UI reserves balance and explicitly reports that bank execution is still pending.

There is no client-side fake financial success state.

For detailed Prompt 32 rules, see `docs/settlement-escrow.md`.
