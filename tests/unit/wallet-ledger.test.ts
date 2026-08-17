import { describe, expect, it, vi } from "vitest";
import { WalletLedgerService } from "@/modules/wallet/wallet-ledger.service";

type LedgerClient = Parameters<
  WalletLedgerService["creditVerifiedPaymentInTransaction"]
>[0];
type Payment = Parameters<
  WalletLedgerService["creditVerifiedPaymentInTransaction"]
>[1];

const now = new Date("2026-08-17T10:00:00.000Z");

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay_verified_1",
    payerUserId: "usr_employer_1",
    walletId: "wlt_1",
    idempotencyKey: "payment:usr_employer_1:test-key",
    amountRials: 5_000_000n,
    purpose: "WALLET_TOPUP",
    referenceId: null,
    description: "شارژ تست",
    provider: "MOCK",
    authority: "MOCK_AUTH_1",
    paymentUrl: "/mock",
    refId: "MOCK_REF_1",
    providerStatusCode: "100",
    providerMessage: "verified",
    status: "SUCCESS",
    callbackReceivedAt: now,
    verifiedAt: now,
    failedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function wallet(availableRials = 10_000_000n) {
  return {
    id: "wlt_1",
    userId: "usr_employer_1",
    availableRials,
    lockedEscrowRials: 0n,
    currency: "RIAL" as const,
    createdAt: now,
    updatedAt: now,
  };
}

function postedCredit(overrides: Record<string, unknown> = {}) {
  return {
    id: "wtx_existing",
    walletId: "wlt_1",
    idempotencyKey: "wallet:payment-credit:pay_verified_1",
    amountRials: 5_000_000n,
    direction: "CREDIT" as const,
    referenceType: "TOPUP" as const,
    referenceId: "pay_verified_1",
    description: "شارژ کیف پول از درگاه پرداخت",
    metadata: {},
    balanceAfterRials: 15_000_000n,
    status: "SUCCESS" as const,
    createdAt: now,
    ...overrides,
  };
}

function fakeClient(selectResults: unknown[][], updatedWallet = wallet(15_000_000n)) {
  const inserted: unknown[] = [];
  const updates: unknown[] = [];

  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => selectResults.shift() ?? []),
      })),
    })),
  }));

  const insert = vi.fn(() => ({
    values: vi.fn(async (value: unknown) => {
      inserted.push(value);
      return undefined;
    }),
  }));

  const update = vi.fn(() => ({
    set: vi.fn((value: unknown) => {
      updates.push(value);
      return {
        where: vi.fn(() => ({
          returning: vi.fn(async () => [updatedWallet]),
        })),
      };
    }),
  }));

  const execute = vi.fn(async () => undefined);

  return {
    client: { select, insert, update, execute } as unknown as LedgerClient,
    inserted,
    updates,
    insert,
    update,
    execute,
  };
}

describe("WalletLedgerService payment credits", () => {
  it("returns the existing posted credit on duplicate callback without another insert", async () => {
    const existing = postedCredit();
    const fake = fakeClient([[wallet()], [existing]]);
    const service = new WalletLedgerService();

    const result = await service.creditVerifiedPaymentInTransaction(
      fake.client,
      payment()
    );

    expect(result).toMatchObject({
      transactionId: "wtx_existing",
      availableRials: 15_000_000n,
      idempotent: true,
    });
    expect(fake.insert).not.toHaveBeenCalled();
    expect(fake.update).not.toHaveBeenCalled();
  });

  it("posts one ledger credit and updates the wallet projection for a new verified topup", async () => {
    const fake = fakeClient([[wallet()], [], [], [wallet()]], wallet(15_000_000n));
    const service = new WalletLedgerService();

    const result = await service.creditVerifiedPaymentInTransaction(
      fake.client,
      payment()
    );

    expect(result.availableRials).toBe(15_000_000n);
    expect(result.idempotent).toBe(false);
    expect(fake.inserted).toHaveLength(2); // ledger entry + AuditLog
    expect(fake.inserted[0]).toMatchObject({
      walletId: "wlt_1",
      idempotencyKey: "wallet:payment-credit:pay_verified_1",
      amountRials: 5_000_000n,
      direction: "CREDIT",
      referenceType: "TOPUP",
      referenceId: "pay_verified_1",
      balanceAfterRials: 15_000_000n,
      status: "SUCCESS",
    });
    expect(fake.updates[0]).toMatchObject({ availableRials: 15_000_000n });
    expect(fake.updates[1]).toMatchObject({ walletId: "wlt_1" });
  });

  it("rejects a duplicate idempotency key that points to different money", async () => {
    const fake = fakeClient([[wallet()], [postedCredit({ amountRials: 4_000_000n })]]);
    const service = new WalletLedgerService();

    await expect(
      service.creditVerifiedPaymentInTransaction(fake.client, payment())
    ).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 });
    expect(fake.insert).not.toHaveBeenCalled();
  });

  it("refuses to credit a pending payment", async () => {
    const fake = fakeClient([]);
    const service = new WalletLedgerService();

    await expect(
      service.creditVerifiedPaymentInTransaction(
        fake.client,
        payment({ status: "PENDING", verifiedAt: null })
      )
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION", statusCode: 409 });
    expect(fake.execute).not.toHaveBeenCalled();
  });

  it("refuses to treat SHIFT_PREFUND as a wallet topup", async () => {
    const fake = fakeClient([]);
    const service = new WalletLedgerService();

    await expect(
      service.creditVerifiedPaymentInTransaction(
        fake.client,
        payment({ purpose: "SHIFT_PREFUND" })
      )
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION", statusCode: 409 });
    expect(fake.execute).not.toHaveBeenCalled();
  });
});
