import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AppError, createErrorResponse } from "@/lib/errors";

/**
 * Legacy GPS-only endpoint intentionally disabled by Prompt 21.
 * Attendance must now be proven through /api/attendance/scan or /api/attendance/code.
 */
export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "shift.checkin");
    throw new AppError(
      "ثبت ورود مستقیم غیرفعال است؛ QR شعبه یا کد مسئول را استفاده کنید.",
      "BAD_REQUEST",
      410
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
