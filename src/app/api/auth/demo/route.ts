import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { DemoAuthService, type DemoRole } from "@/modules/auth/demo-auth.service";

const demoAuthService = new DemoAuthService();

function isDemoRole(value: FormDataEntryValue | null): value is DemoRole {
  return value === "WORKER" || value === "EMPLOYER";
}

function fallbackDestination(role: DemoRole, reason?: string) {
  const slug = role === "WORKER" ? "worker" : "employer";
  const url = new URL(`/demo/${slug}`, "http://karaan.local");
  url.searchParams.set("mode", "readonly");
  if (reason) url.searchParams.set("reason", reason);
  return `${url.pathname}${url.search}`;
}

function wantsHtml(req: NextRequest) {
  return (req.headers.get("accept") ?? "").includes("text/html");
}

export async function POST(req: NextRequest) {
  let requestedRole: DemoRole | null = null;

  try {
    const formData = await req.formData();
    const role = formData.get("role");
    if (!isDemoRole(role)) {
      throw new AppError("فقط دموی کارگر یا کارفرما مجاز است.", "BAD_REQUEST", 400);
    }
    requestedRole = role;

    if (process.env.DEMO_OPEN_ACCESS === "false") {
      throw new AppError("ورود نمایشی غیرفعال است.", "FORBIDDEN", 403);
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
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (requestedRole && wantsHtml(req)) {
      const reason = error instanceof AppError ? error.code : "DEMO_BACKEND_UNAVAILABLE";
      const response = NextResponse.redirect(
        new URL(fallbackDestination(requestedRole, reason), req.url),
        303
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("[Demo Login Error]", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "ورود نمایشی در حال حاضر در دسترس نیست." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
