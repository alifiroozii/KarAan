import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { NotificationService } from "@/modules/notifications/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const notificationService = new NotificationService();
const preferencesSchema = z.object({
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    return createSuccessResponse(await notificationService.getPreferences(session.userId));
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const input = preferencesSchema.parse(await req.json());
    return createSuccessResponse(
      await notificationService.updatePreferences(session.userId, input)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
