# Payment Gateway — Prompt 30 + Wallet handoff in Prompt 31

## Scope

Prompt 30 owns the external payment-gateway lifecycle:

1. create a Payment request,
2. persist the selected provider and Authority,
3. redirect the payer to the gateway,
4. receive the provider callback,
5. verify the payment server-to-server,
6. persist the terminal Payment status and provider reference,
7. expose the result to the authorized payer/finance staff.

Prompt 31 adds exactly one financial side effect for `WALLET_TOPUP`: after provider verification succeeds, the verified Payment is posted exactly once to the authoritative Wallet Ledger and the Wallet balance projection is updated in the same database transaction.

Prompt 31 still does **not** settle a shift, calculate employer fees, pay a worker, execute a payout, or activate escrow operations. Those belong to Prompt 32.

## Source of truth

- Gateway orchestration: `src/modules/payments/payment.service.ts`
- Wallet posting: `src/modules/wallet/wallet-ledger.service.ts`
- Provider contract: `src/infrastructure/payment/payment-adapter.interface.ts`
- Mock provider: `src/infrastructure/payment/mock-payment.adapter.ts`
- ZarinPal provider: `src/infrastructure/payment/zarinpal-payment.adapter.ts`
- Persistent payment records: `payments`, `payment_attempts`, `payment_callbacks`
- Financial ledger: `wallet_transactions`
- Fast wallet projection: `wallets`

`wallet_transactions` is the financial source of truth. `wallets.available_rials` and `wallets.locked_escrow_rials` are projections for fast reads and may only be changed together with the corresponding ledger mutation in an authoritative transaction.

The old `FinanceService.lockEscrow()` / `settleAssignment()` paths fail closed so legacy code cannot bypass the Ledger. The legacy balance columns on employer profiles are not an authoritative financial source and must not be used for new reads/writes.

## Money model

KarAan stores money as integer Rials (`bigint`). No JavaScript floating point value is used for persisted money.

The current ZarinPal adapter converts the internal Rial amount to Toman immediately before provider request/verification. Gateway amounts therefore must be multiples of 10 Rials. PaymentService also enforces minimum and maximum amounts before calling a provider.

## Provider contract

Every provider implements:

- `provider`
- `requestPayment(params)`
- `verifyPayment(authority, amountRials)`
- `parseCallback(params)`

Provider selection is persisted on the Payment. Callback verification resolves the adapter from that persisted provider instead of blindly using the provider currently configured in the environment.

Supported now:

- `MOCK`
- `ZARINPAL`

`SAMAN` remains a future enum value and has no adapter yet; the factory fails closed for unsupported providers.

## Environment

Relevant variables:

```text
PAYMENT_PROVIDER=mock|zarinpal
PAYMENT_CALLBACK_URL=https://app.example.com/api/payments/callback
NEXT_PUBLIC_APP_URL=https://app.example.com
ZARINPAL_MERCHANT_ID=...
ZARINPAL_SANDBOX=true|false
```

`PAYMENT_CALLBACK_URL` is server configuration. The client cannot choose an arbitrary callback URL.

## Creating a Payment

Endpoint:

```text
POST /api/payments
```

Required permission: `payment.topup`.

Required header:

```text
Idempotency-Key: <8-128 safe characters>
```

Example body:

```json
{
  "amountRials": "5000000",
  "description": "شارژ حساب کارآن"
}
```

The public route currently creates `WALLET_TOPUP` Payment records. No Wallet mutation occurs when the request is created; wallet posting happens only after server-to-server verification succeeds.

### Creation idempotency

The key is scoped to the authenticated payer. A PostgreSQL advisory transaction lock serializes concurrent requests using the same scoped key.

- Same key + exact same request -> existing Payment is returned.
- Same key + different amount/purpose/reference/description/provider -> `409 CONFLICT`.
- The generated gateway `paymentUrl` and Authority are persisted, so retrying creation does not request a second Authority.

## Callback and verification

Endpoint:

```text
GET /api/payments/callback
```

Before verification PaymentService validates:

- Payment exists,
- callback provider matches persisted provider,
- callback Authority exactly matches persisted Authority,
- callback status is present.

A mismatched provider or Authority is rejected and never verified.

### Callback idempotency

Callback receipts are persisted in `payment_callbacks` with a unique key derived from:

```text
paymentId + provider + authority + providerStatus
```

A PostgreSQL advisory lock serializes callback processing per Payment.

For a verified `WALLET_TOPUP`, Prompt 31 adds two independent exactly-once walls:

1. deterministic ledger idempotency key `wallet:payment-credit:<paymentId>`,
2. partial unique DB index allowing at most one successful `TOPUP/CREDIT` ledger entry for a Payment reference.

A duplicate callback therefore returns the existing posted transaction rather than increasing balance again.

### Verification and atomic Wallet posting

On successful provider verification:

1. Payment is updated to `SUCCESS`,
2. `verifiedAt` and provider reference are persisted,
3. for `WALLET_TOPUP`, WalletLedgerService posts a `TOPUP/CREDIT` entry,
4. `wallets.availableRials` projection is updated,
5. `payments.walletId` is linked,
6. AuditLog is written,
7. callback receipt is completed.

Steps 1–6 run in the **same database transaction**. A ledger/database failure therefore rolls back the local Payment success transition instead of leaving a successful Payment with an uncredited Wallet.

If the provider already accepted the payment but the local transaction rolled back, a later verification may return an already-verified provider response (for ZarinPal, code `101`). The same callback can retry; the ledger idempotency constraints still guarantee one credit.

A Prompt-30-era Payment that is already `SUCCESS` but has no Wallet Ledger posting can also be safely repaired by replaying the callback or the WalletLedgerService reconciliation entrypoint.

### Verification outcomes

For a definitive gateway/verification failure:

- Payment becomes `FAILED`,
- failure metadata is persisted,
- no Wallet entry is created.

For a temporary provider/network exception during verification:

- Payment remains `PENDING`,
- the failed verify attempt is recorded,
- the callback receipt remains retryable (`processedAt` stays null),
- no Wallet entry is created.

ZarinPal verification code `100` is normal success; `101` is already-verified/idempotent success.

## Attempts and audit trail

`payment_attempts` records:

- `REQUEST`
- `CALLBACK`
- `VERIFY`

Raw secrets are not stored in attempt payloads. `PAYMENT_VERIFIED` audit records may include the resulting `walletId` and `walletTransactionId` for a top-up.

Wallet posting creates a separate `WALLET_PAYMENT_CREDITED` audit event.

## Mock gateway

Development/test can use:

```text
PAYMENT_PROVIDER=mock
```

The mock adapter issues a namespaced Authority and routes the payer to `/api/payments/mock-gateway`. The page can simulate success or cancellation. Mock verification creates a deterministic reference from Authority so repeated verification is testable.

The mock gateway never performs a banking transaction.

## Authorization

- Payment creation requires `payment.topup`.
- Payment detail requires `payment.view`.
- A normal user can read only a Payment for which they are payer.
- Wallet summary/history use the authenticated session user only; the API does not accept another user id.
- `FINANCE_ADMIN`, `ADMIN`, and `SUPER_ADMIN` may read Payment details for operational support, but Prompt 31 does not introduce arbitrary balance-edit endpoints.
- Gateway callback is public by necessity, but amount, payer, provider, Authority and target Payment are resolved/validated from persisted server state.

## Realtime

Terminal Payment changes emit `payment.updated` after transaction success.

A newly posted wallet mutation emits `wallet.updated` only after the transaction commits. TanStack Query invalidates Wallet summary/history and relevant Payment queries.

## Migrations

`drizzle/0013_payment_gateway.sql` introduced the provider/payment callback lifecycle.

`drizzle/0014_wallet_ledger.sql` adds:

- Wallet transaction description/metadata,
- non-negative wallet projection constraints,
- positive ledger amount and non-negative balance-after constraints,
- reference lookup index,
- duplicate-data guard before migration,
- unique posted TOPUP credit per Payment reference.

## Prompt 32 handoff

Prompt 32 should build settlement, employer fees, worker credits, escrow movements and payout preparation **on top of WalletLedgerService**. It must not restore direct writes to legacy employer balance fields or invent a second financial balance source.
