import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { AssignmentQueryService } from "@/modules/assignments/assignment-query.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const queryService = new AssignmentQueryService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [
      "EMPLOYER",
      "BRANCH_MANAGER",
      "SHIFT_SUPERVISOR",
      "ADMIN",
      "SUPER_ADMIN",
    ]);
    const { id } = await params;
    const assignments = await queryService.getEmployerShiftAssignments(
      id,
      session.userId,
      session.role
    );
    return createSuccessResponse(assignments);
  } catch (error) {
    return createErrorResponse(error);
  }
}
