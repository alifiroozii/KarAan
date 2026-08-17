import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { NoShowService } from "@/modules/no-show/no-show.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const service = new NoShowService();

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const result = await service.scanDueAssignments(new Date());
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
