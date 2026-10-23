import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { userRegistry } from "@/lib/user-registry";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "admin.users.manage");
    const result = await userRegistry.purgeAllData();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
