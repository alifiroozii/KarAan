import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { BreakService } from "@/modules/attendance/break.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const breaks = new BreakService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    return createSuccessResponse(
      await breaks.endBreak(id, session.userId, {
        latitude: body.latitude,
        longitude: body.longitude,
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
