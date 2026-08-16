import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AttendanceService } from "@/modules/attendance/attendance.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { z } from "zod";

const checkOutSchema = z.object({
  assignmentId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const attendanceService = new AttendanceService();

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "shift.checkout");
    const parsed = checkOutSchema.parse(await req.json());

    const result = await attendanceService.checkOutWorker(
      parsed.assignmentId,
      session.userId,
      parsed.latitude,
      parsed.longitude
    );

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
