import { z } from "zod";

export const requestOtpSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
  code: z.string().length(5, "کد تایید باید ۵ رقم باشد"),
  role: z.enum(["WORKER", "EMPLOYER", "ADMIN"]).optional(),
  fullName: z.string().optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
