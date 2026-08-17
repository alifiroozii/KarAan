import { NextRequest } from "next/server";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { NotificationService } from "@/modules/notifications/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const notificationService = new NotificationService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const count = await notificationService.getUnreadCount(session.userId);
    return createSuccessResponse({ count });
  } catch (error) {
    return createErrorResponse(error);
  }
}
