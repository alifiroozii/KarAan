import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { DisputeService } from "@/modules/disputes/dispute.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  action: z.enum(["REQUIRE_ADJUSTMENT", "REJECT_DISPUTE"]),
  notes: z.string().min(5).max(3000),
});

const disputes = new DisputeService();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "dispute.manage");
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    return createSuccessResponse(await disputes.resolve(id, session.userId, session.role, body.action, body.notes));
  } catch (error) {
    return createErrorResponse(error);
  }
}
