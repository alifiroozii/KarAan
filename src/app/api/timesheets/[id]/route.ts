import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { TimesheetEngineService } from "@/modules/timesheets/timesheet-engine.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const timesheets = new TimesheetEngineService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "timesheet.view");
    const { id } = await params;
    return createSuccessResponse(
      await timesheets.getForActor(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
