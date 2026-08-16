import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { OvertimeService } from "@/modules/overtime/overtime.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const overtime = new OvertimeService();

export async function POST(
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
    return createSuccessResponse(
      await overtime.cancel(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
