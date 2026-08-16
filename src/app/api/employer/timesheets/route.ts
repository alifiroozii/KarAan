import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { TimesheetEngineService } from "@/modules/timesheets/timesheet-engine.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const timesheets = new TimesheetEngineService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "timesheet.view");
    return createSuccessResponse(
      await timesheets.listForEmployer(session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
