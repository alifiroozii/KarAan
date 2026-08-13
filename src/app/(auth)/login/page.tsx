"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/auth-layout";
import { UserRole } from "@/modules/auth/auth.service";
import { Briefcase, Building2, Smartphone, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("WORKER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) {
      setError("لطفاً شماره موبایل ۱۱ رقمی معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در درخواست کد تایید");
      }

      // Navigate to OTP verification page with parameters
      const query = new URLSearchParams({ phone, role }).toString();
      router.push(`/verify-otp?${query}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "برقراری ارتباط با سرور امکان‌پذیر نیست.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 selection:bg-indigo-500 selection:text-white">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">ورود یا ثبت‌نام در کارآن</h2>
          <p className="text-xs text-muted-foreground">
            شماره موبایل خود را جهت دریافت کد تایید یکبار مصرف وارد کنید.
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setRole("WORKER")}
            className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              role === "WORKER"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>ورود کارجو</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("EMPLOYER")}
            className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              role === "EMPLOYER"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>ورود کارفرما</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="شماره تلفن همراه"
            placeholder="09123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Smartphone className="w-4 h-4" />}
            error={error || undefined}
          />

          <Button
            type="submit"
            className="w-full py-4 text-sm font-bold"
            disabled={loading}
          >
            {loading ? "در حال ارسال..." : "دریافت کد تایید OTP"}
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
