import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { MessagingService } from "@/modules/messaging/messaging.service";
import { AppError, createErrorResponse, createSuccessResponse } from "@/lib/errors";

const messaging = new MessagingService();
const bodySchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "message.view");
    const { id } = await params;
    const cursor = req.nextUrl.searchParams.get("cursor");
    const rawLimit = Number(req.nextUrl.searchParams.get("limit") ?? "40");
    const limit = Number.isFinite(rawLimit) ? rawLimit : 40;
    return createSuccessResponse(
      await messaging.listMessages(id, session.userId, session.role, cursor, limit)
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(req, "message.send");
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    const idempotencyKey = req.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key برای ارسال پیام الزامی است.", "VALIDATION_ERROR", 422);
    }
    return createSuccessResponse(
      await messaging.sendMessage(id, session.userId, session.role, body.content, idempotencyKey),
      201
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
