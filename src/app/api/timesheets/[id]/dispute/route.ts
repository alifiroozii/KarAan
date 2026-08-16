import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { TimesheetEngineService } from "@/modules/timesheets/timesheet-engine.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  reasonCode: z.string().min(1).max(80),
  description: z.string().min(5).max(2000),
});

const timesheets = new TimesheetEngineService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "timesheet.dispute");
    const { id } = await params;
    const body = bodySchema.parse(await req.json());

    return createSuccessResponse(
      await timesheets.dispute(
        id,
        session.userId,
        session.role,
        body.reasonCode,
        body.description
      )
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
