import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/modules/auth/auth.service";

const authService = new AuthService();

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("karaan_session")?.value;

  if (token) {
    await authService.revokeSession(token);
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.delete("karaan_session");

  return response;
}
