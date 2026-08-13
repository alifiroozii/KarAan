import { NextRequest, NextResponse } from "next/server";
import { getMapProvider } from "@/lib/maps/factory";
import { z } from "zod";

const routingSchema = z.object({
  origin: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  destination: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = routingSchema.parse(body);

    const provider = getMapProvider();
    const result = await provider.calculateRoute(parsed.origin, parsed.destination);

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در مسیریابی";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
