import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { ShiftOfferService } from "@/modules/matching/shift-offer.service";

const offerService = new ShiftOfferService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "shift.accept");
    const { id } = await params;

    const result = await offerService.declineOffer(id, session.userId);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در رد پیشنهاد شیفت";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
