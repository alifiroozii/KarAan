import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { DemoAuthService, type DemoRole } from "@/modules/auth/demo-auth.service";

const demoAuthService = new DemoAuthService();

function isDemoRole(value: FormDataEntryValue | null): value is DemoRole {
  return value === "WORKER" || value === "EMPLOYER";
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.DEMO_OPEN_ACCESS === "false") {
      throw new AppError("ورود نمایشی غیرفعال است.", "FORBIDDEN", 403);
    }

    const formData = await req.formData();
    const role = formData.get("role");
    if (!isDemoRole(role)) {
      throw new AppError("فقط دموی کارگر یا کارفرما مجاز است.", "BAD_REQUEST", 400);
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const { token, expiresAt } = await demoAuthService.createSession(
      role,
      userAgent,
      ipAddress
    );

    const destination = role === "WORKER" ? "/worker" : "/employer";
    const response = NextResponse.redirect(new URL(destination, req.url), 303);
    response.cookies.set("karaan_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("[Demo Login Error]", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "ورود نمایشی در حال حاضر در دسترس نیست." },
      { status: 500 }
    );
  }
}
