import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { ReliabilityService } from "@/modules/reliability/reliability.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const reliability = new ReliabilityService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    return createSuccessResponse(await reliability.getWorkerSummary(session.userId));
  } catch (error) {
    return createErrorResponse(error);
  }
}
