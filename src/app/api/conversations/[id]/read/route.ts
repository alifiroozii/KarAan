import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { MessagingService } from "@/modules/messaging/messaging.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const messaging = new MessagingService();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "message.view");
    const { id } = await params;
    return createSuccessResponse(await messaging.markRead(id, session.userId, session.role));
  } catch (error) {
    return createErrorResponse(error);
  }
}
