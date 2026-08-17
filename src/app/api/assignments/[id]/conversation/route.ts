import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { MessagingService } from "@/modules/messaging/messaging.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const messaging = new MessagingService();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "message.send");
    const { id } = await params;
    return createSuccessResponse(
      await messaging.ensureAssignmentConversation(id, session.userId, session.role),
      201
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
