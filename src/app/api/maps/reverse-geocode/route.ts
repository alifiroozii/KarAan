import { NextRequest, NextResponse } from "next/server";
import { getMapProvider } from "@/lib/maps/factory";
import { z } from "zod";

const reverseGeocodeSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reverseGeocodeSchema.parse(body);

    const provider = getMapProvider();
    const result = await provider.reverseGeocode(parsed.latitude, parsed.longitude);

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در تبدیل مختصات به آدرس";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
