"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Lock, ArrowRight, RefreshCw } from "lucide-react";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const role = searchParams.get("role") || "WORKER";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(120);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 5) {
      setError("لطفاً کد تایید ۵ یا ۶ رقمی دریافتی را وارد کنید.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "کد تایید اشتباه است.");
      }

      // Redirect user to appropriate portal based on role
      if (role === "EMPLOYER") {
        router.push("/employer");
      } else {
        router.push("/worker");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطا در تایید کد OTP";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setCooldown(120);
      }
    } catch {
      setError("خطا در ارسال مجدد کد");
    }
  };

  return (
    <div className="space-y-6 selection:bg-indigo-500 selection:text-white">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>تغییر شماره موبایل ({phone})</span>
      </button>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">تایید کد ارسال شده</h2>
        <p className="text-xs text-muted-foreground">
          کد تایید ارسال‌شده به شماره <strong className="text-foreground">{phone}</strong> را وارد کنید.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
        <Input
          label="کد تایید یکبار مصرف (OTP)"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          error={error || undefined}
          maxLength={6}
          className="text-center tracking-widest text-lg font-bold"
        />

        <Button
          type="submit"
          className="w-full py-4 text-sm font-bold"
          disabled={loading}
        >
          {loading ? "در حال بررسی..." : "ورود به حساب کاربری"}
        </Button>
      </form>

      <div className="text-center pt-2">
        {cooldown > 0 ? (
          <p className="text-xs text-muted-foreground">
            ارسال مجدد کد تا <strong className="text-foreground">{cooldown} ثانیه</strong> دیگر امکان‌پذیر است.
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-xs font-bold text-indigo-400 hover:underline inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ارسال مجدد کد تایید</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="p-4 text-center text-xs">در حال بارگذاری...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </AuthLayout>
  );
}
