import { NextRequest } from "next/server";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { NotificationService } from "@/modules/notifications/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const notificationService = new NotificationService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    return createSuccessResponse(await notificationService.markRead(session.userId, id));
  } catch (error) {
    return createErrorResponse(error);
  }
}
