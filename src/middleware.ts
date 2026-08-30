import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  const token = request.cookies.get("karaan_session")?.value;
  const role = request.cookies.get("karaan_role")?.value;
  if (!token || role !== "ADMIN") return NextResponse.redirect(new URL("/login?callbackUrl=/admin", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
