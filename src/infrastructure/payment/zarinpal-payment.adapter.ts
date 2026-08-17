import type {
  IPaymentAdapter,
  PaymentCallbackPayload,
  PaymentRequestParams,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-adapter.interface";
import { env } from "@/config/env";
import { rialsToToman } from "@/lib/money";

interface ZarinpalEnvelope {
  data?: {
    code?: number;
    authority?: string;
    ref_id?: number | string;
  };
  errors?: {
    code?: number;
    message?: string;
  };
}

export class ZarinpalPaymentAdapter implements IPaymentAdapter {
  readonly provider = "ZARINPAL" as const;

  constructor(
    private readonly merchantId = env.ZARINPAL_MERCHANT_ID ?? "",
    private readonly isSandbox = env.ZARINPAL_SANDBOX
  ) {}

  private assertConfigured() {
    if (!this.merchantId) {
      throw new Error("ZARINPAL_MERCHANT_ID is required when PAYMENT_PROVIDER=zarinpal");
    }
  }

  private get baseUrl(): string {
    return this.isSandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";
  }

  private get startPayUrl(): string {
    return this.isSandbox
      ? "https://sandbox.zarinpal.com/pg/StartPay"
      : "https://www.zarinpal.com/pg/StartPay";
  }

  private async post(path: "request.json" | "verify.json", body: Record<string, unknown>) {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "KarAan-Payment/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });

    let data: ZarinpalEnvelope;
    try {
      data = (await response.json()) as ZarinpalEnvelope;
    } catch {
      throw new Error(`Zarinpal returned a non-JSON response (${response.status})`);
    }

    if (!response.ok && !data.errors?.code) {
      throw new Error(`Zarinpal HTTP error ${response.status}`);
    }
    return data;
  }

  async requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult> {
    this.assertConfigured();
    const amountToman = rialsToToman(params.amountRials);
    const data = await this.post("request.json", {
      merchant_id: this.merchantId,
      amount: amountToman,
      description: params.description,
      callback_url: params.callbackUrl,
      metadata: params.userPhone ? { mobile: params.userPhone } : {},
    });

    if (data.data?.code === 100 && data.data.authority) {
      return {
        paymentUrl: `${this.startPayUrl}/${encodeURIComponent(data.data.authority)}`,
        authority: data.data.authority,
        statusCode: data.data.code,
        message: "Payment request accepted",
      };
    }

    throw new Error(
      `Zarinpal request failed (${data.errors?.code ?? "UNKNOWN"}): ${data.errors?.message ?? "Unknown error"}`
    );
  }

  async verifyPayment(
    authority: string,
    amountRials: bigint
  ): Promise<PaymentVerifyResult> {
    this.assertConfigured();
    const amountToman = rialsToToman(amountRials);
    const data = await this.post("verify.json", {
      merchant_id: this.merchantId,
      amount: amountToman,
      authority,
    });

    const code = data.data?.code;
    if ((code === 100 || code === 101) && data.data) {
      return {
        success: true,
        alreadyVerified: code === 101,
        refId: data.data.ref_id != null ? String(data.data.ref_id) : undefined,
        statusCode: code,
        message: code === 101 ? "پرداخت قبلاً تایید شده است." : "پرداخت با موفقیت تایید شد.",
      };
    }

    return {
      success: false,
      statusCode: data.errors?.code ?? code ?? 400,
      message: data.errors?.message ?? "تایید پرداخت ناموفق بود.",
    };
  }

  parseCallback(params: Record<string, string | undefined>): PaymentCallbackPayload {
    return {
      authority: params.Authority ?? params.authority ?? "",
      status: (params.Status ?? params.status ?? "").toUpperCase(),
    };
  }
}
