import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow unrestricted access to the admin login page and API routes
  if (pathname === "/admin/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
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

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
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

  return NextResponse.next();
}

// Fallback for older middleware conventions if queried
export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|apk)$).*)",
  ],
};
