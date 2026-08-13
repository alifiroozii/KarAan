"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, ArrowLeft, Loader2, User, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("09123456789");
  const [otpCode, setOtpCode] = useState("12345");
  const [role, setRole] = useState<"WORKER" | "EMPLOYER">("WORKER");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "خطا در ارسال کد تایید");
      }

      setStep("OTP");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY",
          phone,
          code: otpCode,
          role,
          fullName: fullName || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || "کد تایید اشتباه است");
      }

      // Redirect based on role
      if (role === "WORKER") {
        router.push("/worker");
      } else {
        router.push("/employer");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ورود به کارآن</h1>
          <p className="text-slate-400 text-sm">
            {step === "PHONE"
              ? "شماره موبایل خود را جهت دریافت کد تایید وارد کنید"
              : `کد پیامک‌شده به ${phone} را وارد کنید`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {step === "PHONE" ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                نوع حساب کاربری
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("WORKER")}
                  className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                    role === "WORKER"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>کارجو / نیروی کار</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("EMPLOYER")}
                  className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                    role === "EMPLOYER"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>کارفرما</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                شماره همراه (مثال: ۰۹۱۲۳۴۵۶۷۸۹)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-left tracking-widest text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>ارسال کد تایید</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="علی رضایی"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                کد ۵ رقمی ارسال شده (کد آزمایشی: ۱۲۳۴۵)
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={5}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>تایید کد و ورود</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              اصلاح شماره موبایل
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
