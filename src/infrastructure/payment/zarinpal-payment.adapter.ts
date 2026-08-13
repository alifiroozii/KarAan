import {
  IPaymentAdapter,
  PaymentRequestParams,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-adapter.interface";
import { rialsToToman } from "@/lib/money";

export class ZarinpalPaymentAdapter implements IPaymentAdapter {
  private merchantId: string;
  private isSandbox: boolean;

  constructor(
    merchantId = process.env.ZARINPAL_MERCHANT_ID || "",
    isSandbox = process.env.NODE_ENV !== "production"
  ) {
    this.merchantId = merchantId;
    this.isSandbox = isSandbox;
  }

  private get baseUrl(): string {
    return this.isSandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";
  }

  async requestPayment(
    params: PaymentRequestParams
  ): Promise<PaymentRequestResult> {
    const amountToman = rialsToToman(params.amountRials);
    const response = await fetch(`${this.baseUrl}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: amountToman,
        description: params.description,
        callback_url: params.callbackUrl,
        metadata: { mobile: params.userPhone || "" },
      }),
    });

    const data = await response.json();
    if (data?.data?.code === 100) {
      const authority = data.data.authority;
      const redirectUrl = this.isSandbox
        ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
        : `https://www.zarinpal.com/pg/StartPay/${authority}`;

      return { paymentUrl: redirectUrl, authority };
    }

    throw new Error(`Zarinpal Payment Request Failed: ${data?.errors?.message || "Unknown error"}`);
  }

  async verifyPayment(
    authority: string,
    amountRials: bigint
  ): Promise<PaymentVerifyResult> {
    const amountToman = rialsToToman(amountRials);
    const response = await fetch(`${this.baseUrl}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: amountToman,
        authority,
      }),
    });

    const data = await response.json();
    if (data?.data?.code === 100 || data?.data?.code === 101) {
      return {
        success: true,
        refId: String(data.data.ref_id),
        statusCode: data.data.code,
        message: "پرداخت با موفقیت تایید شد",
      };
    }

    return {
      success: false,
      statusCode: data?.errors?.code || 400,
      message: data?.errors?.message || "تایید پرداخت ناموفق بود",
    };
  }
}
