import { NextRequest, NextResponse } from "next/server";
import { userRegistry } from "@/lib/user-registry";
import { UserRole } from "@/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, role, phone, avatarUrl, platform, skills, city } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "ایمیل یا حساب جیمیل نامعتبر است." },
        { status: 400 }
      );
    }

    // Role validation
    const validRoles: UserRole[] = ["WORKER", "EMPLOYER", "ADMIN"];
    const targetRole = validRoles.includes(role) ? role : "WORKER";

    const { user, token } = await userRegistry.registerOrLoginGmail({
      email,
      fullName: fullName || email.split("@")[0],
      role: targetRole,
      phone,
      avatarUrl,
      platform: platform === "ANDROID" ? "ANDROID" : platform === "IOS" ? "IOS" : "WEB",
      skills: Array.isArray(skills) ? skills : undefined,
      city,
    });

    const response = NextResponse.json({
      success: true,
      message: "ورود با حساب گوگل با موفقیت انجام شد.",
      data: {
        token,
        user,
      },
    });

    // Set HTTP-only session cookie
    response.cookies.set("karaan_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "خطای ناشناخته در ورود با جیمیل";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Returns recent logins and stats for quick status check
  const stats = await userRegistry.getOverviewStats();
  const recent = userRegistry.getRecentLogins(5);
  return NextResponse.json({
    success: true,
    data: {
      stats,
      recentLogins: recent,
    },
  });
}
