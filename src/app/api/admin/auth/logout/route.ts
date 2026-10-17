import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "خروج از پنل مدیریت با موفقیت انجام شد.",
  });

  response.cookies.delete("karaan_admin_auth");
  response.cookies.delete("karaan_session");

  return response;
}
