import { NextRequest } from "next/server";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { NotificationService } from "@/modules/notifications/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const notificationService = new NotificationService();

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get("limit") ?? "25");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 25;
    const data = await notificationService.listForUser(session.userId, {
      limit,
      cursor: searchParams.get("cursor"),
      unreadOnly: searchParams.get("unreadOnly") === "true",
    });
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
