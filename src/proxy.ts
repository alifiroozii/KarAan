import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // Handle CORS preflight OPTIONS requests for API
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const preflight = new NextResponse(null, { status: 204 });
    if (origin) {
      preflight.headers.set("Access-Control-Allow-Origin", origin);
      preflight.headers.set("Access-Control-Allow-Credentials", "true");
      preflight.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      preflight.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-Karjoor-Client, X-App-Platform"
      );
      preflight.headers.set("Access-Control-Max-Age", "86400");
    }
    return preflight;
  }

  // Redirect legacy login/auth routes to admin login
  if (pathname === "/login" || pathname === "/register" || pathname === "/verify-otp") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Redirect root and legacy portal routes directly to /admin
  if (
    pathname === "/" ||
    pathname.startsWith("/worker") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/design-system") ||
    pathname.startsWith("/about")
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Protect all /admin routes (except login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminAuth = request.cookies.get("karaan_admin_auth")?.value;
    const session = request.cookies.get("karaan_session")?.value;

    const isAuthenticated =
      adminAuth === "authenticated" ||
      session === "sess_admin_master_token" ||
      request.cookies.get("karaan_role")?.value === "ADMIN";

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const response = NextResponse.next();

  // Apply OWASP Security Headers uniformly
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)"
  );

  // Controlled CORS for APIs
  if (pathname.startsWith("/api/") && origin) {
    const isAllowedOrigin =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("kar-aan.vercel.app") ||
      origin.endsWith(".vercel.app");

    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-Karjoor-Client, X-App-Platform"
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|apk)$).*)",
  ],
};
