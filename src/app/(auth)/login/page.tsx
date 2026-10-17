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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground font-medium">یا ورود سریع</span>
          </div>
        </div>

        {/* Gmail Login Section */}
        <GmailAuthButton role={role} />

        <div className="text-center pt-2">
          <a
            href="/admin/login"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4"
          >
            ورود به پنل مدیریت سامانه (Admin Dashboard)
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

function GmailAuthButton({ role }: { role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("لطفاً آدرس جیمیل معتبر وارد کنید.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: fullName || email.split("@")[0],
          phone: phone || "09120000000",
          role,
          platform: "WEB",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ورود با جیمیل ناموفق بود.");
      }

      // Redirect to the appropriate dashboard
      if (role === "EMPLOYER") {
        router.push("/employer");
      } else {
        router.push("/worker");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 shadow-sm"
      >
        <svg className="w-4 h-4 fill-current text-rose-400" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
        <span>ورود با حساب گوگل (Gmail)</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl text-right">
            <h3 className="text-base font-bold text-foreground mb-1">ورود سریع با حساب گوگل (Gmail)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              اطلاعات حساب گوگل خود را وارد نمایید تا بلافاصله به داشبورد و اپ متصل شوید:
            </p>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleGmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">آدرس جیمیل (Gmail)</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">نام و نام خانوادگی</label>
                <input
                  type="text"
                  placeholder="مثال: علی رضایی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">شماره موبایل (اختیاری)</label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1 py-2.5 text-xs font-bold">
                  {loading ? "در حال ورود..." : "تأیید و ورود به پنل"}
                </Button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold hover:bg-muted"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
