import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { DisputeService } from "@/modules/disputes/dispute.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const disputes = new DisputeService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "dispute.view");
    return createSuccessResponse(await disputes.listForActor(session.userId, session.role));
  } catch (error) {
    return createErrorResponse(error);
  }
}
