export interface PaymentRequestParams {
  amountRials: bigint;
  description: string;
  callbackUrl: string;
  userPhone?: string;
}

export interface PaymentRequestResult {
  paymentUrl: string;
  authority: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  refId?: string;
  statusCode?: number;
  message?: string;
}

export interface IPaymentAdapter {
  requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult>;
  verifyPayment(
    authority: string,
    amountRials: bigint
  ): Promise<PaymentVerifyResult>;
}
