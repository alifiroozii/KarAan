import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { OvertimeService } from "@/modules/overtime/overtime.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const bodySchema = z.object({
  requestedEndAt: z.coerce.date(),
  rateType: z.enum(["NORMAL_RATE", "MULTIPLIER", "FIXED_BONUS"]),
  rateMultiplier: z.number().min(1).max(3).default(1),
  fixedBonusRials: z.string().regex(/^\d+$/).default("0"),
  note: z.string().max(1000).optional(),
});

const overtime = new OvertimeService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [
      "EMPLOYER",
      "BRANCH_MANAGER",
      "SHIFT_SUPERVISOR",
      "ADMIN",
      "SUPER_ADMIN",
    ]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());

    return createSuccessResponse(
      await overtime.request({
        assignmentId: id,
        actorUserId: session.userId,
        actorRole: session.role,
        requestedEndAt: body.requestedEndAt,
        rateType: body.rateType,
        rateMultiplierBps: Math.round(body.rateMultiplier * 10_000),
        fixedBonusRials: BigInt(body.fixedBonusRials),
        note: body.note,
      }),
      201
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
