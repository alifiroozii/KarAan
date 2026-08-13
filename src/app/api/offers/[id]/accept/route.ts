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

    const result = await offerService.acceptOfferAtomic(id, session.userId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 409 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در پذیرش پیشنهاد شیفت";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
