import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AttendanceService } from "@/modules/attendance/attendance.service";
import { z } from "zod";

const checkOutSchema = z.object({
  assignmentId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

const attendanceService = new AttendanceService();

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "shift.checkout");
    const body = await req.json();
    const parsed = checkOutSchema.parse(body);

    const result = await attendanceService.checkOutWorker(
      parsed.assignmentId,
      parsed.latitude,
      parsed.longitude
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ثبت خروج شیفت";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
