import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { TimesheetService } from "@/modules/timesheets/timesheet.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const timesheetService = new TimesheetService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "timesheet.approve");
    const { id } = await params;
    return createSuccessResponse(
      await timesheetService.approve(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
