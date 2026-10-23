import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { userRegistry } from "@/lib/user-registry";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "admin.audit.view");
    const reports = await userRegistry.getComprehensiveReports();
    return createSuccessResponse(reports);
  } catch (error) {
    return createErrorResponse(error);
  }
}
