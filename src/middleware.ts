import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("karaan_session")?.value;

  // Protected route prefixes
  const isWorkerRoute = pathname.startsWith("/worker");
  const isEmployerRoute = pathname.startsWith("/employer");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isWorkerRoute || isEmployerRoute || isAdminRoute) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/worker/:path*", "/employer/:path*", "/admin/:path*"],
};
