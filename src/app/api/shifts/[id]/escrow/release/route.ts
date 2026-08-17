import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { EscrowService } from "@/modules/settlement/escrow.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const escrowService = new EscrowService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "payment.settle");
    const { id } = await params;
    return createSuccessResponse(
      await escrowService.releaseRemaining(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
