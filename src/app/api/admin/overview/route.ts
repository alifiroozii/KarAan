import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AdminOperationsService } from "@/modules/admin/admin-operations.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const admin = new AdminOperationsService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "admin.audit.view");
    return createSuccessResponse(await admin.getOverview(session.role));
  } catch (error) {
    return createErrorResponse(error);
  }
}
