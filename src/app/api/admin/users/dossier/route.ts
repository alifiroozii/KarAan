import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { userRegistry } from "@/lib/user-registry";
import { createErrorResponse, createSuccessResponse, AppError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "admin.users.manage");
    const phone = req.nextUrl.searchParams.get("phone");
    if (!phone) {
      throw new AppError("شماره تلفن کاربر الزامی است.", "VALIDATION_ERROR", 400);
    }

    const dossier = await userRegistry.getUserDossierByPhone(phone);
    if (!dossier) {
      throw new AppError("پرونده‌ای برای این شماره تلفن یافت نشد.", "NOT_FOUND", 404);
    }

    return createSuccessResponse(dossier);
  } catch (error) {
    return createErrorResponse(error);
  }
}
