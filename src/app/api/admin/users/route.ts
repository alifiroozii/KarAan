import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AdminOperationsService } from "@/modules/admin/admin-operations.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const admin = new AdminOperationsService();
const roleSchema = z.enum([
  "WORKER",
  "EMPLOYER",
  "BRANCH_MANAGER",
  "SHIFT_SUPERVISOR",
  "SUPPORT_AGENT",
  "DISPUTE_AGENT",
  "FINANCE_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
]);

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "admin.users.manage");
    const params = req.nextUrl.searchParams;
    const roleRaw = params.get("role");
    const blockedRaw = params.get("blocked");
    const limitRaw = Number(params.get("limit") ?? "30");
    const role = roleRaw ? roleSchema.parse(roleRaw) : null;
    const blocked = blockedRaw === null || blockedRaw === "" ? null : z.enum(["true", "false"]).parse(blockedRaw) === "true";
    return createSuccessResponse(
      await admin.listUsers(session.role, {
        q: params.get("q"),
        role,
        blocked,
        cursor: params.get("cursor"),
        limit: Number.isFinite(limitRaw) ? limitRaw : 30,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
