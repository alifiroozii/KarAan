import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { WorkerRelationshipService } from "@/modules/relationships/worker-relationship.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const relationships = new WorkerRelationshipService();
const roles = [
  "WORKER",
  "EMPLOYER",
  "BRANCH_MANAGER",
  "SHIFT_SUPERVISOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

const bodySchema = z.object({
  blocked: z.boolean(),
  reason: z.string().trim().max(1000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...roles]);
    const { id } = await params;
    return createSuccessResponse(
      await relationships.getCounterpartyBlock(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...roles]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    return createSuccessResponse(
      await relationships.setCounterpartyBlock({
        assignmentId: id,
        actorUserId: session.userId,
        actorRole: session.role,
        blocked: body.blocked,
        reason: body.reason,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
