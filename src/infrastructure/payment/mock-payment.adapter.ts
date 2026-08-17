import crypto from "crypto";
import type {
  IPaymentAdapter,
  PaymentCallbackPayload,
  PaymentRequestParams,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-adapter.interface";

export class MockPaymentAdapter implements IPaymentAdapter {
  readonly provider = "MOCK" as const;

  async requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult> {
    const authority = `MOCK_${crypto.randomUUID()}`;
    return {
      paymentUrl: `/api/payments/mock-gateway?authority=${encodeURIComponent(authority)}`,
      authority,
      statusCode: 100,
      message: "Mock payment created",
    };
  }

  async verifyPayment(
    authority: string,
    _amountRials: bigint
  ): Promise<PaymentVerifyResult> {
    if (!authority.startsWith("MOCK_")) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid mock authority",
      };
    }

    const digest = crypto.createHash("sha256").update(authority).digest("hex").slice(0, 12);
    return {
      success: true,
      refId: `MOCKREF_${digest}`,
      statusCode: 100,
      message: "پرداخت آزمایشی با موفقیت تایید شد.",
    };
  }

  parseCallback(params: Record<string, string | undefined>): PaymentCallbackPayload {
    return {
      authority: params.Authority ?? params.authority ?? "",
      status: (params.Status ?? params.status ?? "").toUpperCase(),
    };
  }
}
