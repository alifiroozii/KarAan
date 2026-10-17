import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ADMIN_PASSWORD = "KarAan@Admin2026!";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!password || password.trim() !== expectedPassword.trim()) {
      return NextResponse.json(
        { success: false, error: "رمز عبور پنل مدیریت نادرست است." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "ورود به پنل مدیریت موفقیت‌آمیز بود.",
      data: {
        role: "SUPER_ADMIN",
        fullName: "مدیر ارشد کاروین",
      },
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Set secure admin session cookies
    response.cookies.set("karaan_admin_auth", "authenticated", {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    });

    response.cookies.set("karaan_session", "sess_admin_master_token", {
      httpOnly: true,
      secure: isProduction,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "خطای ناشناخته در ورود ادمین";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
