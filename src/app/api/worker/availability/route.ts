import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { WorkerPresenceService } from "@/lib/redis/presence";
import { z } from "zod";

const updateAvailabilitySchema = z.object({
  status: z.enum(["OFFLINE", "AVAILABLE", "BUSY", "WORKING"]),
  maxDistanceKm: z.number().default(15),
  minPayRials: z.string().default("1500000"),
  availableUntil: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const presenceService = new WorkerPresenceService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "worker.availability.update");
    const presence = await presenceService.getWorkerPresence(session.userId);

    return NextResponse.json({ success: true, presence });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در دریافت وضعیت آمادگی";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission(req, "worker.availability.update");
    const body = await req.json();
    const parsed = updateAvailabilitySchema.parse(body);

    if (parsed.status === "OFFLINE") {
      await presenceService.setWorkerOffline(session.userId);
      return NextResponse.json({ success: true, status: "OFFLINE" });
    }

    const presence = await presenceService.setWorkerAvailable({
      workerId: session.userId,
      status: parsed.status,
      maxDistanceKm: parsed.maxDistanceKm,
      minPayRials: parsed.minPayRials,
      availableUntil: parsed.availableUntil,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    });

    return NextResponse.json({ success: true, presence });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در بروزرسانی وضعیت آمادگی";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
