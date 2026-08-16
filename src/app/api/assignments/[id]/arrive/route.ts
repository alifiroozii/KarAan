import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { AssignmentLifecycleService } from "@/modules/assignments/assignment-lifecycle.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const arriveSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10_000),
});

const lifecycleService = new AssignmentLifecycleService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    const { id } = await params;
    const input = arriveSchema.parse(await req.json());

    const result = await lifecycleService.markArrived(id, session.userId, {
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracy,
    });

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
