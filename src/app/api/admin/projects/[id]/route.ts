import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { userRegistry } from "@/lib/user-registry";

const updateProjectSchema = z.object({
  status: z.enum([
    "ACTIVE",
    "APPROVED",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "admin.users.manage");
    const { id: requestId } = await params;
    const body = await req.json();
    const parsed = updateProjectSchema.parse(body);

    const updated = await userRegistry.updateRequestStatus(
      requestId,
      parsed.status,
      parsed.notes
    );

    if (!updated) {
      return createErrorResponse(new Error("پروژه یا سفارش مورد نظر یافت نشد."));
    }

    return createSuccessResponse({
      project: updated,
      message: `وضعیت پروژه به ${parsed.status} با موفقیت به‌روزرسانی شد.`,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
