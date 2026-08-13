import { NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { AppError } from "@/lib/errors";

const authService = new AuthService();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const result = await authService.requestOtp(phone);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.message, code: err.code, details: err.details },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: "خطا در درخواست کد تایید" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { phone, code, role } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "شماره موبایل و کد تایید الزامی هستند." },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for") || undefined;

    const { token, user, expiresAt } = await authService.verifyOtp(
      phone,
      code,
      role || "WORKER",
      userAgent,
      ipAddress
    );

    const response = NextResponse.json(
      { success: true, user: { id: user.id, phone: user.phone, role: user.role, fullName: user.fullName } },
      { status: 200 }
    );

    // Set HttpOnly Secure Cookie
    response.cookies.set("karaan_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: "خطا در بررسی کد تایید" },
      { status: 500 }
    );
  }
}
