import { NextRequest, NextResponse } from "next/server";
import { userRegistry } from "@/lib/user-registry";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { isVerified } = body;

    const updated = await userRegistry.setUserVerification(id, Boolean(isVerified));
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: "کاربر یافت نشد." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `وضعیت احراز هویت کاربر به ${isVerified ? "تأیید شده" : "تأیید نشده"} تغییر یافت.`,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update user verification:", error);
    return NextResponse.json(
      { success: false, error: { message: "خطا در تغییر وضعیت تأیید کاربر" } },
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
