import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { MessagingService } from "@/modules/messaging/messaging.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const messaging = new MessagingService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "message.view");
    return createSuccessResponse(await messaging.listConversations(session.userId, session.role));
  } catch (error) {
    return createErrorResponse(error);
  }
}
