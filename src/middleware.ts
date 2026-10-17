import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow unrestricted access to the admin login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
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

export const config = { matcher: ["/admin/:path*"] };
