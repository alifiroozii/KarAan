import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { LocationTrackingService } from "@/modules/location/location-tracking.service";
import { z } from "zod";

const locationUpdateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
  batteryLevel: z.number().optional(),
  assignmentId: z.string().optional(),
});

const trackingService = new LocationTrackingService();

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission(req, "worker.availability.update");
    const body = await req.json();
    const parsed = locationUpdateSchema.parse(body);

    const result = await trackingService.updateWorkerLocation({
      workerId: session.userId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      speed: parsed.speed,
      batteryLevel: parsed.batteryLevel,
      assignmentId: parsed.assignmentId,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ثبت موقعیت مکانی زنده";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
