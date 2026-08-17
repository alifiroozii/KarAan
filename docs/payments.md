# Payment Gateway — Prompt 30

## Scope

Prompt 30 owns only the external payment-gateway lifecycle:

1. create a Payment request,
2. persist the selected provider and Authority,
3. redirect the payer to the gateway,
4. receive the provider callback,
5. verify the payment server-to-server,
6. persist the terminal Payment status and provider reference,
7. expose the result to the authorized payer/finance staff.

It does **not** credit a Wallet, create Wallet ledger entries, lock Shift escrow, settle a Timesheet, or create a Payout. Those mutations belong to Prompt 31/32 and must consume a verified Payment idempotently.

## Source of truth

- Gateway orchestration: `src/modules/payments/payment.service.ts`
- Provider contract: `src/infrastructure/payment/payment-adapter.interface.ts`
- Mock provider: `src/infrastructure/payment/mock-payment.adapter.ts`
- ZarinPal provider: `src/infrastructure/payment/zarinpal-payment.adapter.ts`
- Persistent records: `payments`, `payment_attempts`, `payment_callbacks`

The older `FinanceService.lockEscrow()` / `settleAssignment()` implementation is not part of the Prompt 30 callback path and must not be wired to a provider callback.

## Money model

KarAan stores money as integer Rials (`bigint`). No JavaScript floating point value is used for persisted money.

The current ZarinPal adapter converts the internal Rial amount to Toman immediately before the provider request/verification. Therefore gateway amounts must be multiples of 10 Rials. The Payment service also enforces minimum and maximum amounts before calling a provider.

## Provider contract

Every provider implements:

- `provider`
- `requestPayment(params)`
- `verifyPayment(authority, amountRials)`
- `parseCallback(params)`

Provider selection is persisted on the Payment. Callback verification resolves the adapter from that persisted provider instead of blindly using the provider currently configured in the environment.

Supported in Prompt 30:

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

The public Prompt 30 route currently creates only `WALLET_TOPUP` Payment records. A successful gateway payment still does not mutate Wallet state.

### Creation idempotency

The key is scoped to the authenticated payer. A PostgreSQL advisory transaction lock serializes concurrent requests using the same scoped key.

- Same key + exact same request -> existing Payment is returned.
- Same key + different amount/purpose/reference/description/provider -> `409 CONFLICT`.
- The generated gateway `paymentUrl` and Authority are persisted, so a retry does not request a second Authority from the provider.

## Callback and verification

Endpoint:

```text
GET /api/payments/callback
```

The callback route receives the internal `paymentId` and persisted provider identity through the server-generated callback URL. Provider callback parameters are parsed by the adapter.

Before verification, PaymentService validates:

- Payment exists,
- callback provider matches the persisted Payment provider,
- callback Authority exactly matches the persisted Payment Authority,
- callback status is present.

A mismatched provider or Authority is rejected and never verified.

### Callback idempotency

Callback receipts are persisted in `payment_callbacks` with a unique key derived from:

```text
paymentId + provider + authority + providerStatus
```

A PostgreSQL advisory lock serializes processing per Payment.

If a callback receipt is already processed, the result is returned without invoking provider verification again. If the Payment is already `SUCCESS`, subsequent callbacks cannot repeat any business side effect.

### Verification outcomes

For a successful provider verification:

- Payment becomes `SUCCESS`,
- provider reference id is stored,
- provider status/message are stored,
- `verifiedAt` is set,
- AuditLog is written,
- `payment.updated` is published after the transaction.

For a definitive gateway/verification failure:

- Payment becomes `FAILED`,
- failure metadata is persisted.

For a temporary provider/network exception during verification:

- Payment remains `PENDING`,
- the failed verify attempt is recorded,
- the callback receipt remains retryable (`processedAt` stays null),
- the same callback can safely retry later.

ZarinPal verification code `100` is handled as normal success; `101` is handled as already-verified/idempotent success.

## Attempts and audit trail

`payment_attempts` records three attempt classes:

- `REQUEST`
- `CALLBACK`
- `VERIFY`

Raw secrets are not stored in the attempt payloads. Payment audit entries explicitly mark `walletMutationDeferred: true` for Prompt 30.

## Mock gateway

Development/test can use:

```text
PAYMENT_PROVIDER=mock
```

The mock adapter issues a namespaced Authority and routes the payer to `/api/payments/mock-gateway`. The page can simulate success or cancellation. Mock verification creates a deterministic reference from the Authority, which makes repeated verification testable and idempotent.

The mock gateway never performs a banking transaction.

## Authorization

- Payment creation requires `payment.topup`.
- Payment detail requires `payment.view`.
- A normal user can read only a Payment for which they are the payer.
- `FINANCE_ADMIN`, `ADMIN`, and `SUPER_ADMIN` may read Payment details for operational support.
- Gateway callback is public by necessity, but it cannot select amount, payer, provider, or Authority; all are checked against persisted server-side state.

## Realtime

Terminal Payment changes emit `payment.updated` only after the database transaction succeeds. TanStack Query invalidates the individual Payment and payment lists.

## Migration

`drizzle/0013_payment_gateway.sql`:

- adds Payment purpose/payer/provider metadata,
- makes Wallet linkage nullable,
- adds provider Authority uniqueness,
- adds typed Payment attempts,
- adds idempotent callback receipts,
- refuses unsafe legacy data conditions instead of silently deleting records.

The Drizzle journal also registers migration `0012_worker_relationships` before `0013_payment_gateway`.

## Prompt 31 handoff

Prompt 31 should introduce the authoritative Wallet ledger and an idempotent consumer of verified `WALLET_TOPUP` Payments. The recommended idempotency reference is the verified Payment id (or a deterministic key derived from it). It must guarantee exactly one Wallet credit for one successful Payment, even if Payment callbacks or consumers are retried.
