import { NextRequest } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { breaks } from "@/db/schema/attendance";
import { shiftAssignments } from "@/db/schema/shifts";
import { requireRole } from "@/modules/auth/auth.middleware";
import { AppError, createErrorResponse, createSuccessResponse } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(req, ["WORKER"]);
    const { id } = await params;
    const [assignment] = await db
      .select({ workerId: shiftAssignments.workerId })
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, id))
      .limit(1);
    if (!assignment) throw new AppError("شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (assignment.workerId !== session.userId) {
      throw new AppError("این شیفت متعلق به شما نیست.", "FORBIDDEN", 403);
    }

    const [active] = await db
      .select()
      .from(breaks)
      .where(and(eq(breaks.assignmentId, id), isNull(breaks.endAt)))
      .orderBy(desc(breaks.startAt))
      .limit(1);

    return createSuccessResponse(
      active
        ? { active: true, breakId: active.id, startedAt: active.startAt }
        : { active: false, breakId: null, startedAt: null }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
