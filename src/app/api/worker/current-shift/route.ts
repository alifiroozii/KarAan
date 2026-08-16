import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { AssignmentQueryService } from "@/modules/assignments/assignment-query.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const queryService = new AssignmentQueryService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    const currentShift = await queryService.getCurrentWorkerAssignment(session.userId);
    return createSuccessResponse(currentShift);
  } catch (error) {
    return createErrorResponse(error);
  }
}
