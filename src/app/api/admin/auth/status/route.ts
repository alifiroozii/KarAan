import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get("karaan_admin_auth")?.value;
  const sessionCookie = req.cookies.get("karaan_session")?.value;

  const isAuthenticated =
    adminCookie === "authenticated" || sessionCookie === "sess_admin_master_token";

  return NextResponse.json({
    success: true,
    data: {
      authenticated: isAuthenticated,
      role: isAuthenticated ? "SUPER_ADMIN" : null,
    },
  });
}
