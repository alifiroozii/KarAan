# Wallet Ledger — Prompt 31

## Principle

`wallet_transactions` is KarAan's financial source of truth. The `wallets` table is a read-optimized projection of available and locked balances. Business code must never mutate a balance without producing the corresponding immutable Ledger entry in the same database transaction.

Legacy balance fields on domain profiles are deprecated financial data and are not authoritative.

## Current scope

Prompt 31 implements:

- one Wallet per user,
- immutable posted Ledger entries,
- exactly-once `WALLET_TOPUP` credit from a verified Payment,
- Wallet balance projection,
- authenticated Wallet summary and paginated history APIs,
- realtime `wallet.updated`,
- employer and worker Wallet UI,
- projection reconciliation read check,
- fail-closed legacy finance writers.

Prompt 31 does not implement shift settlement, escrow locking/release, platform fees, worker earnings settlement or payouts. Those are Prompt 32.

## Exactly-once top-up

A successful Payment credit is identified by the Payment id.

Deterministic Ledger key:

```text
wallet:payment-credit:<paymentId>
```

Protection layers:

1. `wallet_transactions.idempotency_key` is globally unique.
2. A partial unique index permits at most one successful `TOPUP/CREDIT` row per Payment `reference_id`.
3. Callback processing is serialized per Payment with a PostgreSQL advisory transaction lock.
4. Wallet creation is serialized per user.
5. The Wallet row is locked before calculating the next balance.

Exact duplicate retries return the existing Ledger entry. A duplicate key that does not match the same wallet, Payment, direction and amount fails with `409 CONFLICT` instead of silently reusing unrelated money.

## Payment transaction boundary

For `WALLET_TOPUP`, Payment verification and Wallet posting are one local database transaction:

```text
Provider verify succeeds
  -> Payment SUCCESS
  -> Ledger CREDIT/TOPUP
  -> Wallet projection increment
  -> Payment.walletId linkage
  -> AuditLog
  -> callback receipt processed
COMMIT
```

Realtime events are emitted after commit.

Provider calls are external and cannot participate in the DB transaction. If provider verification succeeds but the local transaction fails, the local transaction rolls back. A retry can receive the provider's already-verified result and post the Ledger entry safely. Idempotency prevents a second credit.

## Ledger entry rules

Posted entries use positive `amountRials`; direction determines the sign of the financial effect.

- `CREDIT`: adds to available balance when applicable.
- `DEBIT`: subtracts from available balance when applicable.

Prompt 31 creates only `CREDIT / TOPUP` entries. Future reference types already present in the schema are reserved for Prompt 32+ workflows and must use authoritative Ledger methods rather than direct table writes.

Database constraints currently enforce:

- Wallet available balance >= 0.
- Wallet locked balance >= 0.
- Ledger amount > 0.
- Ledger balance-after >= 0.
- At most one successful TOPUP credit per Payment reference.

## Balance projection

`wallets.availableRials` is updated in the same transaction as a Ledger mutation for fast UI/API reads.

`WalletLedgerService.reconcileProjection(userId)` independently sums successful Ledger CREDIT minus DEBIT entries and compares that total with the projection. It is read-only in Prompt 31; it reports drift rather than silently rewriting financial data.

Locked escrow reconciliation will be expanded in Prompt 32 when escrow Ledger semantics are implemented.

## API

### Wallet summary

```text
GET /api/wallet
```

Requires `payment.view`. The authenticated session user is the Wallet owner; no user id is accepted from the client.

Money is serialized as decimal strings.

### Wallet transactions

```text
GET /api/wallet/transactions?limit=25&cursor=...
```

Uses keyset pagination ordered by `(createdAt DESC, id DESC)`. Cursor is an opaque base64url value representing the last row. Invalid cursors return validation error rather than falling back to another account or offset.

## Realtime

A new posted Ledger mutation emits:

```text
wallet.updated
```

Payload contains Wallet id, user id, available/locked amounts, transaction id and a typed reason. The event is published only after DB commit and invalidates Wallet summary/history queries.

## Legacy finance paths

`FinanceService.lockEscrow()` and `FinanceService.settleAssignment()` intentionally fail closed with `409 CONFLICT` in Prompt 31. Their previous direct balance mutations could create divergence and incorrect settlement Ledger entries.

`SettlementService` also remains fail closed until the Prompt 32 financial workflow is implemented.

## UI

Employer:

- `/employer/wallet`
- real balance in employer header
- Ledger history
- link to create a new top-up Payment

Worker:

- `/worker/wallet`
- real Wallet balance/history
- bottom navigation links to the Wallet route

There is no client-side fake financial success state.

## Prompt 32 requirements

Prompt 32 must extend the same Ledger for:

- employer prefunding/escrow,
- release/refund,
- approved Timesheet settlement,
- employer service fee,
- worker commission policy (currently 0%),
- worker Wallet credit,
- payout preparation/execution.

It must keep financial operations idempotent, auditable and transactionally consistent, and must not reintroduce direct profile balance mutations.
