import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/config/env";
import { PaymentService } from "@/modules/payments/payment.service";
import { createErrorResponse } from "@/lib/errors";

const paymentService = new PaymentService();

const callbackEnvelopeSchema = z.object({
  paymentId: z.string().min(5).max(100),
  provider: z.enum(["MOCK", "ZARINPAL"]),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const envelope = callbackEnvelopeSchema.parse({
      paymentId: url.searchParams.get("paymentId"),
      provider: url.searchParams.get("provider")?.toUpperCase(),
    });

    const rawParams: Record<string, string | undefined> = {};
    for (const [key, value] of url.searchParams.entries()) rawParams[key] = value;

    const result = await paymentService.handleCallback({
      paymentId: envelope.paymentId,
      provider: envelope.provider,
      params: rawParams,
    });

    const gatewayResult = result.status === "SUCCESS"
      ? "success"
      : result.retryable
        ? "pending"
        : "failed";

    const target = new URL(`/employer/payments/${result.paymentId}`, env.NEXT_PUBLIC_APP_URL);
    target.searchParams.set("gateway", gatewayResult);
    return NextResponse.redirect(target, 303);
  } catch (error) {
    return createErrorResponse(error);
  }
}
