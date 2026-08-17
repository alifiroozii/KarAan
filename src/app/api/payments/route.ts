import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { PaymentService } from "@/modules/payments/payment.service";
import { AppError, createErrorResponse, createSuccessResponse } from "@/lib/errors";

const paymentService = new PaymentService();

const createPaymentSchema = z.object({
  amountRials: z.string().regex(/^\d+$/),
  description: z.string().trim().min(3).max(255).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "payment.topup");
    const idempotencyKey = req.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey) {
      throw new AppError(
        "برای ایجاد پرداخت ارسال Idempotency-Key الزامی است.",
        "VALIDATION_ERROR",
        422
      );
    }

    const body = createPaymentSchema.parse(await req.json());
    const payment = await paymentService.createPayment({
      payerUserId: session.userId,
      idempotencyKey,
      amountRials: BigInt(body.amountRials),
      purpose: "WALLET_TOPUP",
      description: body.description ?? "شارژ حساب کارآن",
    });

    return createSuccessResponse(payment, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}
