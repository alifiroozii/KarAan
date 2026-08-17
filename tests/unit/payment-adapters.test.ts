import { afterEach, describe, expect, it, vi } from "vitest";
import { MockPaymentAdapter } from "@/infrastructure/payment/mock-payment.adapter";
import { ZarinpalPaymentAdapter } from "@/infrastructure/payment/zarinpal-payment.adapter";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
});

describe("MockPaymentAdapter", () => {
  it("creates a mock authority and local gateway url", async () => {
    const adapter = new MockPaymentAdapter();
    const result = await adapter.requestPayment({
      paymentId: "pay_test",
      amountRials: 1_000_000n,
      description: "test payment",
      callbackUrl: "http://localhost:3000/api/payments/callback",
    });

    expect(result.authority).toMatch(/^MOCK_/);
    expect(result.paymentUrl).toContain("/api/payments/mock-gateway?authority=");
  });

  it("verifies the same authority deterministically", async () => {
    const adapter = new MockPaymentAdapter();
    const authority = "MOCK_11111111-1111-4111-8111-111111111111";

    const first = await adapter.verifyPayment(authority, 1_000_000n);
    const duplicate = await adapter.verifyPayment(authority, 1_000_000n);

    expect(first.success).toBe(true);
    expect(duplicate.success).toBe(true);
    expect(duplicate.refId).toBe(first.refId);
  });

  it("rejects an authority outside the mock namespace", async () => {
    const adapter = new MockPaymentAdapter();
    const result = await adapter.verifyPayment("FOREIGN_AUTH", 1_000_000n);
    expect(result.success).toBe(false);
  });

  it("normalizes callback parameter casing", () => {
    const adapter = new MockPaymentAdapter();
    expect(adapter.parseCallback({ Authority: "MOCK_1", Status: "OK" })).toEqual({
      authority: "MOCK_1",
      status: "OK",
    });
    expect(adapter.parseCallback({ authority: "MOCK_2", status: "ok" })).toEqual({
      authority: "MOCK_2",
      status: "OK",
    });
  });
});

describe("ZarinpalPaymentAdapter", () => {
  it("converts internal Rials to Toman for a payment request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { code: 100, authority: "A000000000000000000000000000000000001" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new ZarinpalPaymentAdapter("merchant-test", true);
    const result = await adapter.requestPayment({
      paymentId: "pay_test",
      amountRials: 1_000_000n,
      description: "test payment",
      callbackUrl: "http://localhost:3000/api/payments/callback",
    });

    expect(result.authority).toBe("A000000000000000000000000000000000001");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(init.body));
    expect(payload.amount).toBe(100_000);
    expect(payload.merchant_id).toBe("merchant-test");
  });

  it("treats verification code 100 as a new success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { code: 100, ref_id: 123456 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const adapter = new ZarinpalPaymentAdapter("merchant-test", true);
    const result = await adapter.verifyPayment("AUTH", 1_000_000n);
    expect(result).toMatchObject({
      success: true,
      alreadyVerified: false,
      refId: "123456",
      statusCode: 100,
    });
  });

  it("treats verification code 101 as idempotent success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { code: 101, ref_id: 123456 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const adapter = new ZarinpalPaymentAdapter("merchant-test", true);
    const result = await adapter.verifyPayment("AUTH", 1_000_000n);
    expect(result).toMatchObject({
      success: true,
      alreadyVerified: true,
      refId: "123456",
      statusCode: 101,
    });
  });

  it("returns a failed verification without inventing a reference id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errors: { code: -51, message: "failed" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const adapter = new ZarinpalPaymentAdapter("merchant-test", true);
    const result = await adapter.verifyPayment("AUTH", 1_000_000n);
    expect(result.success).toBe(false);
    expect(result.refId).toBeUndefined();
    expect(result.statusCode).toBe(-51);
  });

  it("parses Authority and Status from the gateway callback", () => {
    const adapter = new ZarinpalPaymentAdapter("merchant-test", true);
    expect(adapter.parseCallback({ Authority: "AUTH", Status: "OK" })).toEqual({
      authority: "AUTH",
      status: "OK",
    });
  });
});
