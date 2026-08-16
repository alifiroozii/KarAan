import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { SecureAttendanceService } from "@/modules/attendance/secure-attendance.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  branchId: z.string().min(1),
  assignmentId: z.string().min(1),
  purpose: z.enum(["CHECK_IN", "CHECK_OUT"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10_000),
  deviceId: z.string().max(200).optional(),
});

const secureAttendance = new SecureAttendanceService();

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    const body = bodySchema.parse(await req.json());

    const result = await secureAttendance.processSupervisorCode({
      code: body.code,
      branchId: body.branchId,
      assignmentId: body.assignmentId,
      workerUserId: session.userId,
      purpose: body.purpose,
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        accuracyMeters: body.accuracy,
        deviceId: body.deviceId,
      },
    });

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
