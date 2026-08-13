import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { WorkerPresenceService } from "@/lib/redis/presence";
import { z } from "zod";

const heartbeatSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const presenceService = new WorkerPresenceService();

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "worker.availability.update");
    const body = await req.json();
    const parsed = heartbeatSchema.parse(body);

    const presence = await presenceService.touchHeartbeat(
      session.userId,
      parsed.latitude,
      parsed.longitude
    );

    if (!presence) {
      return NextResponse.json(
        { success: false, error: "کاربر آفلاین است. ابتدا وضعیت را به AVAILABLE تغییر دهید." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, lastHeartbeatAt: presence.lastHeartbeatAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ثبت پالس زنده ضربان قلب (Heartbeat)";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
