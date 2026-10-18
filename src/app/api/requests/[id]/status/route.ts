import { NextRequest, NextResponse } from "next/server";
import { userRegistry } from "@/lib/user-registry";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, notes } = body;

    const validStatuses = [
      "ACTIVE",
      "APPROVED",
      "ACCEPTED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `وضعیت نامعتبر است. وضعیت‌های مجاز: ${validStatuses.join(", ")}` },
        },
        { status: 400 }
      );
    }

    const updated = await userRegistry.updateRequestStatus(id, status, notes);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: "درخواست مورد نظر یافت نشد." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `وضعیت درخواست با موفقیت به ${status} تغییر یافت.`,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update request status:", error);
    return NextResponse.json(
      { success: false, error: { message: "خطا در تغییر وضعیت درخواست" } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(req, context);
}
