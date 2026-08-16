import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { TimesheetEngineService } from "@/modules/timesheets/timesheet-engine.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const timesheets = new TimesheetEngineService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    return createSuccessResponse(await timesheets.listForWorker(session.userId));
  } catch (error) {
    return createErrorResponse(error);
  }
}
