import {
  IPaymentAdapter,
  PaymentRequestParams,
  PaymentRequestResult,
  PaymentVerifyResult,
} from "./payment-adapter.interface";

export class MockPaymentAdapter implements IPaymentAdapter {
  async requestPayment(
    params: PaymentRequestParams
  ): Promise<PaymentRequestResult> {
    const mockAuthority = `MOCK_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(
      `[MockPayment] Payment requested: ${params.amountRials} Rials for "${params.description}"`
    );

    return {
      paymentUrl: `/api/finance/mock-gateway?authority=${mockAuthority}&amount=${params.amountRials}&callback=${encodeURIComponent(params.callbackUrl)}`,
      authority: mockAuthority,
    };
  }

  async verifyPayment(
    authority: string,
    amountRials: bigint
  ): Promise<PaymentVerifyResult> {
    console.log(
      `[MockPayment] Payment verified for authority: ${authority}, amount: ${amountRials} Rials`
    );
    return {
      success: true,
      refId: `REF_${Math.floor(10000000 + Math.random() * 90000000)}`,
      statusCode: 100,
      message: "پرداخت با موفقیت انجام شد (Mock)",
    };
  }
}
