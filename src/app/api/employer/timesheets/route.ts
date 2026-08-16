import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { TimesheetService } from "@/modules/timesheets/timesheet.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const timesheets = new TimesheetService();
const querySchema = z.object({
  branchId: z.string().min(1).optional(),
  workerId: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "timesheet.view");
    const url = new URL(req.url);
    const filters = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    return createSuccessResponse(
      await timesheets.listForEmployer(session.userId, session.role, filters)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
