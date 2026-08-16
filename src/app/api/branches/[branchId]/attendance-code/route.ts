import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { AttendanceCredentialService } from "@/modules/attendance/attendance-credential.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  purpose: z.enum(["CHECK_IN", "CHECK_OUT"]),
});

const credentials = new AttendanceCredentialService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await requirePermission(req, "attendance.manage");
    const { branchId } = await params;
    const body = bodySchema.parse(await req.json());

    const credential = await credentials.issueSupervisorCode({
      branchId,
      purpose: body.purpose,
      actorUserId: session.userId,
      actorRole: session.role,
    });

    return createSuccessResponse(credential, 201);
  } catch (error) {
    return createErrorResponse(error);
  }
}
