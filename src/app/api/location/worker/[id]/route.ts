import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { LocationTrackingService } from "@/modules/location/location-tracking.service";

const trackingService = new LocationTrackingService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "business.read");
    const { id } = await params;

    const result = await trackingService.getWorkerLocationForEmployer(id, session.userId);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در دریافت موقعیت مکانی نیرو";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
