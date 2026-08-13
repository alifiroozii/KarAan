import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AttendanceService } from "@/modules/attendance/attendance.service";
import { z } from "zod";

const checkInSchema = z.object({
  assignmentId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

const attendanceService = new AttendanceService();

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "shift.checkin");
    const body = await req.json();
    const parsed = checkInSchema.parse(body);

    const result = await attendanceService.checkInWorker(
      parsed.assignmentId,
      parsed.latitude,
      parsed.longitude
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ثبت ورود زنده";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
