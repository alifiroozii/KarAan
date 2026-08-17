import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { ReliabilityService } from "@/modules/reliability/reliability.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const reliability = new ReliabilityService();

const adjustmentSchema = z.object({
  delta: z.number().min(-100).max(100).refine((value) => value !== 0, "delta نباید صفر باشد"),
  reason: z.string().trim().min(10).max(1000),
  idempotencyKey: z.string().trim().min(8).max(200),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT", "DISPUTE_AGENT"]);
    const { id } = await params;
    return createSuccessResponse(await reliability.getWorkerSummary(id));
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, ["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const body = adjustmentSchema.parse(await req.json());

    return createSuccessResponse(
      await reliability.applyEvent({
        workerId: id,
        eventType: "MANUAL_ADJUSTMENT",
        sourceType: "MANUAL_ADJUSTMENT",
        sourceId: body.idempotencyKey,
        scoreDelta: body.delta,
        reason: body.reason,
        actorId: session.userId,
        metadata: { requestedByRole: session.role },
      })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
