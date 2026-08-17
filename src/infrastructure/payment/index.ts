import { env } from "@/config/env";
import type { IPaymentAdapter, PaymentProviderName } from "./payment-adapter.interface";
import { MockPaymentAdapter } from "./mock-payment.adapter";
import { ZarinpalPaymentAdapter } from "./zarinpal-payment.adapter";

export * from "./payment-adapter.interface";
export * from "./mock-payment.adapter";
export * from "./zarinpal-payment.adapter";

const mockInstance = new MockPaymentAdapter();
let zarinpalInstance: ZarinpalPaymentAdapter | null = null;

export function getConfiguredPaymentProvider(): PaymentProviderName {
  return env.PAYMENT_PROVIDER === "zarinpal" ? "ZARINPAL" : "MOCK";
}

export function getPaymentAdapter(provider = getConfiguredPaymentProvider()): IPaymentAdapter {
  if (provider === "MOCK") return mockInstance;
  if (provider === "ZARINPAL") {
    zarinpalInstance ??= new ZarinpalPaymentAdapter();
    return zarinpalInstance;
  }
  throw new Error(`Unsupported payment provider: ${String(provider)}`);
}
