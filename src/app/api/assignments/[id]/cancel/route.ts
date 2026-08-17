import { NextRequest } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { requireRole } from "@/modules/auth/auth.middleware";
import { CancellationService } from "@/modules/cancellations/cancellation.service";

const allowedRoles = [
  "WORKER",
  "EMPLOYER",
  "BRANCH_MANAGER",
  "SHIFT_SUPERVISOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

const bodySchema = z.object({
  reasonCode: z.enum([
    "SICKNESS",
    "TRANSPORT",
    "EMERGENCY",
    "SCHEDULE_CONFLICT",
    "STAFFING_CHANGE",
    "BUSINESS_CLOSED",
    "SHIFT_CHANGED",
    "WORKER_MISMATCH",
    "OTHER",
  ]),
  description: z.string().trim().max(1000).optional(),
});

const cancellations = new CancellationService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...allowedRoles]);
    const { id } = await params;
    return createSuccessResponse(
      await cancellations.preview(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...allowedRoles]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    return createSuccessResponse(
      await cancellations.cancel({
        assignmentId: id,
        actorUserId: session.userId,
        actorRole: session.role,
        reasonCode: body.reasonCode,
        description: body.description,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
