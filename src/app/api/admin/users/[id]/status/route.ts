import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AdminOperationsService } from "@/modules/admin/admin-operations.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const admin = new AdminOperationsService();
const bodySchema = z.object({
  blocked: z.boolean(),
  reason: z.string().trim().min(5).max(500),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "admin.users.manage");
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    return createSuccessResponse(
      await admin.setBlockedStatus(id, session.userId, session.role, { ...body, ipAddress })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
