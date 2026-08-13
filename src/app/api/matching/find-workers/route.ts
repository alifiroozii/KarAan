import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { MatchingService } from "@/modules/matching/matching.service";
import { z } from "zod";

const findWorkersSchema = z.object({
  shiftId: z.string().min(1),
  maxDistanceKm: z.number().optional().default(25),
  limit: z.number().optional().default(20),
});

const matchingService = new MatchingService();

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "shift.view");
    const body = await req.json();
    const parsed = findWorkersSchema.parse(body);

    const workers = await matchingService.findQualifiedWorkers(parsed);
    return NextResponse.json({ success: true, workers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در جستجوی نیروهای واجد شرایط";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
