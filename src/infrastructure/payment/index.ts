import { IPaymentAdapter } from "./payment-adapter.interface";
import { MockPaymentAdapter } from "./mock-payment.adapter";
import { ZarinpalPaymentAdapter } from "./zarinpal-payment.adapter";

export * from "./payment-adapter.interface";
export * from "./mock-payment.adapter";
export * from "./zarinpal-payment.adapter";

const mockInstance = new MockPaymentAdapter();

export function getPaymentAdapter(): IPaymentAdapter {
  if (process.env.PAYMENT_PROVIDER === "zarinpal" && process.env.ZARINPAL_MERCHANT_ID) {
    return new ZarinpalPaymentAdapter();
  }
  return mockInstance;
}
