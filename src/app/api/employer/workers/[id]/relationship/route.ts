import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { WorkerRelationshipService } from "@/modules/relationships/worker-relationship.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const relationships = new WorkerRelationshipService();
const roles = ["EMPLOYER", "BRANCH_MANAGER", "SHIFT_SUPERVISOR", "ADMIN", "SUPER_ADMIN"] as const;

const bodySchema = z.object({
  rosterType: z.enum(["FAVORITE", "PREFERRED", "BLOCKED"]).nullable(),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...roles]);
    const { id } = await params;
    return createSuccessResponse(
      await relationships.getEmployerRelationship(session.userId, session.role, id)
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
      await relationships.setEmployerRoster({
        actorUserId: session.userId,
        actorRole: session.role,
        workerUserId: id,
        rosterType: body.rosterType,
        notes: body.notes,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
