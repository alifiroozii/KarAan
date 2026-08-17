import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { PayoutService } from "@/modules/payouts/payout.service";
import { AppError, createErrorResponse, createSuccessResponse } from "@/lib/errors";

const payoutService = new PayoutService();
const payoutSchema = z.object({
  amountRials: z
    .union([
      z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح ریالی باشد"),
      z.number().int().safe().positive(),
    ])
    .transform((value) => BigInt(value)),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "payment.payout");
    const parsed = payoutSchema.parse(await req.json());
    const idempotencyKey = req.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key برای برداشت الزامی است.", "VALIDATION_ERROR", 422);
    }
    return createSuccessResponse(
      await payoutService.requestPayout({
        workerUserId: session.userId,
        amountRials: parsed.amountRials,
        idempotencyKey,
      }),
      201
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "payment.payout");
    return createSuccessResponse(await payoutService.listForWorker(session.userId));
  } catch (error) {
    return createErrorResponse(error);
  }
}
