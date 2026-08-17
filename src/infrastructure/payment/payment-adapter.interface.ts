export type PaymentProviderName = "MOCK" | "ZARINPAL";

export interface PaymentRequestParams {
  paymentId: string;
  amountRials: bigint;
  description: string;
  callbackUrl: string;
  userPhone?: string;
}

export interface PaymentRequestResult {
  paymentUrl: string;
  authority: string;
  statusCode?: number;
  message?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  alreadyVerified?: boolean;
  refId?: string;
  statusCode?: number;
  message?: string;
}

export interface PaymentCallbackPayload {
  authority: string;
  status: string;
}

export interface IPaymentAdapter {
  readonly provider: PaymentProviderName;
  requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult>;
  verifyPayment(authority: string, amountRials: bigint): Promise<PaymentVerifyResult>;
  parseCallback(params: Record<string, string | undefined>): PaymentCallbackPayload;
}
