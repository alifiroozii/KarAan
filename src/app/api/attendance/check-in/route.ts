import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AttendanceService } from "@/modules/attendance/attendance.service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const checkInSchema = z.object({
  assignmentId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const attendanceService = new AttendanceService();

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "shift.checkin");
    const parsed = checkInSchema.parse(await req.json());

    const result = await attendanceService.checkInWorker(
      parsed.assignmentId,
      session.userId,
      parsed.latitude,
      parsed.longitude
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { success: false, error: { code: err.code, message: err.message, details: err.details } },
        { status: err.statusCode }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "اطلاعات موقعیت معتبر نیست." } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "CHECK_IN_FAILED", message: "خطا در ثبت ورود." } },
      { status: 500 }
    );
  }
}
