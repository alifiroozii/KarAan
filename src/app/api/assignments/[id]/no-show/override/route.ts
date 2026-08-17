import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { NoShowService } from "@/modules/no-show/no-show.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  reason: z.string().trim().min(10).max(1000),
});

const service = new NoShowService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [
      "SUPPORT_AGENT",
      "DISPUTE_AGENT",
      "ADMIN",
      "SUPER_ADMIN",
    ]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    return createSuccessResponse(
      await service.override({
        assignmentId: id,
        actorUserId: session.userId,
        actorRole: session.role,
        reason: body.reason,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
