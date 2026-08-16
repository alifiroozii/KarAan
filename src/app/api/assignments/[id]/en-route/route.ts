import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { AssignmentLifecycleService } from "@/modules/assignments/assignment-lifecycle.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const lifecycleService = new AssignmentLifecycleService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    const { id } = await params;
    const result = await lifecycleService.markEnRoute(id, session.userId);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
