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
    const session = await requireRole(req, ["WORKER"]);
    const { id } = await params;
    return createSuccessResponse(await overtime.respond(id, session.userId, "ACCEPTED"));
  } catch (error) {
    return createErrorResponse(error);
  }
}
