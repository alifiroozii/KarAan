import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";

const schema = z.object({ phone: z.string().min(10), otp: z.string().min(4), role: z.enum(["REQUESTER", "PROVIDER", "ADMIN"]).default("REQUESTER") });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات ورود معتبر نیست." }, { status: 400 });
  const token = `karvin_${crypto.randomBytes(32).toString("hex")}`;
  const response = NextResponse.json({ success: true, token, role: parsed.data.role });
  response.cookies.set("karaan_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set("karaan_role", parsed.data.role, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
