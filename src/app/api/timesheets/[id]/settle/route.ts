import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { SettlementService } from "@/modules/settlement/settlement.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const settlementService = new SettlementService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "payment.settle");
    const { id } = await params;
    return createSuccessResponse(
      await settlementService.settleTimesheet(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
