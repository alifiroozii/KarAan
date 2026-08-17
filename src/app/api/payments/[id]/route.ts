import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { PaymentService } from "@/modules/payments/payment.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const paymentService = new PaymentService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "payment.view");
    const { id } = await params;
    return createSuccessResponse(
      await paymentService.getPaymentForActor(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
