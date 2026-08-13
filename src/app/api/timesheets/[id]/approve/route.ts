import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { SettlementService } from "@/modules/settlement/settlement.service";

const settlementService = new SettlementService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "timesheet.approve");
    const { id } = await params;

    const result = await settlementService.approveTimesheet(id, session.userId);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در تایید تایم‌شیت و تسویه مالی";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
