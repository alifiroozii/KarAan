import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AdminOperationsService } from "@/modules/admin/admin-operations.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const admin = new AdminOperationsService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "admin.audit.view");
    const params = req.nextUrl.searchParams;
    const limitRaw = Number(params.get("limit") ?? "40");
    return createSuccessResponse(
      await admin.listAuditLogs(session.role, {
        q: params.get("q"),
        actorId: params.get("actorId"),
        entityName: params.get("entityName"),
        action: params.get("action"),
        cursor: params.get("cursor"),
        limit: Number.isFinite(limitRaw) ? limitRaw : 40,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
