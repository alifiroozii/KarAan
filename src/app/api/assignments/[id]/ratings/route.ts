import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/modules/auth/auth.middleware";
import { RatingService } from "@/modules/ratings/rating.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const rating = new RatingService();

const bodySchema = z.object({
  score: z.number().int().min(1).max(5),
  tags: z.array(z.string().trim().min(1).max(100)).max(5).default([]),
  comment: z.string().trim().max(1000).optional(),
});

const allowedRoles = [
  "WORKER",
  "EMPLOYER",
  "BRANCH_MANAGER",
  "SHIFT_SUPERVISOR",
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...allowedRoles]);
    const { id } = await params;
    return createSuccessResponse(
      await rating.getForActor(id, session.userId, session.role)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, [...allowedRoles]);
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    return createSuccessResponse(
      await rating.submit({
        assignmentId: id,
        actorUserId: session.userId,
        actorRole: session.role,
        score: body.score,
        tags: body.tags,
        comment: body.comment,
      }),
      201
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
