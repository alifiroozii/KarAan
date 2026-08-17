import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { PaymentService } from "@/modules/payments/payment.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

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
      return createErrorResponse(
        new Error("Idempotency-Key header is required for payment creation")
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
