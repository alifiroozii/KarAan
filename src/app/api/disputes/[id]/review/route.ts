import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { DisputeService } from "@/modules/disputes/dispute.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const disputes = new DisputeService();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "dispute.manage");
    const { id } = await params;
    return createSuccessResponse(await disputes.startReview(id, session.userId, session.role));
  } catch (error) {
    return createErrorResponse(error);
  }
}
