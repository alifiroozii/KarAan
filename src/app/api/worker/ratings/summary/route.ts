import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { RatingService } from "@/modules/ratings/rating.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const rating = new RatingService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    return createSuccessResponse(await rating.getWorkerQualitySummary(session.userId));
  } catch (error) {
    return createErrorResponse(error);
  }
}
