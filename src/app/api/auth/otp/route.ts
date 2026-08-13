import { NextRequest } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/errors";
import { z } from "zod";

const authService = new AuthService();

const requestOtpSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
  code: z.string().length(5, "کد تایید باید ۵ رقم باشد"),
  role: z.enum(["WORKER", "EMPLOYER"]).optional(),
  fullName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "VERIFY") {
      const parsed = verifyOtpSchema.parse(body);
      const result = await authService.verifyOTPAndLogin(
        parsed.phone,
        parsed.code,
        parsed.role || "WORKER",
        parsed.fullName
      );

      const response = createSuccessResponse({
        session: result.session,
        token: result.token,
        isNewUser: result.isNewUser,
      });

      // Set session cookie
      response.cookies.set("karaan_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // Default action: REQUEST_OTP
    const parsed = requestOtpSchema.parse(body);
    const result = await authService.requestOTP(parsed.phone);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
