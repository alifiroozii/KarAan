"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import {
  Clock3,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Purpose = "CHECK_IN" | "CHECK_OUT";

interface QrCredential {
  credentialId: string;
  token: string;
  purpose: Purpose;
  branchId: string;
  expiresAt: string;
  ttlSeconds: number;
}

interface SupervisorCode {
  credentialId: string;
  code: string;
  purpose: Purpose;
  branchId: string;
  expiresAt: string;
  ttlSeconds: number;
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "عملیات ناموفق بود.");
  }
  return body.data as T;
}

export function BranchAttendanceConsole({ branchId }: { branchId: string }) {
  const [purpose, setPurpose] = useState<Purpose>("CHECK_IN");
  const [qrImage, setQrImage] = useState<{ token: string; dataUrl: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const qrQuery = useQuery({
    queryKey: ["branch", branchId, "attendance-qr", purpose],
    queryFn: async () =>
      readResult<QrCredential>(
        await fetch(`/api/branches/${branchId}/attendance-qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose }),
        })
      ),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const codeMutation = useMutation({
    mutationFn: async () =>
      readResult<SupervisorCode>(
        await fetch(`/api/branches/${branchId}/attendance-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose }),
        })
      ),
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = qrQuery.data?.token;
    if (!token) return;

    let cancelled = false;
    void QRCode.toDataURL(token, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((dataUrl) => {
      if (!cancelled) setQrImage({ token, dataUrl });
    });

    return () => {
      cancelled = true;
    };
  }, [qrQuery.data?.token]);

  const qrDataUrl =
    qrImage?.token === qrQuery.data?.token ? qrImage.dataUrl : null;

  const qrSecondsLeft = useMemo(() => {
    if (!qrQuery.data) return 0;
    return Math.max(0, Math.ceil((new Date(qrQuery.data.expiresAt).getTime() - now) / 1000));
  }, [now, qrQuery.data]);

  const codeSecondsLeft = useMemo(() => {
    if (!codeMutation.data) return 0;
    return Math.max(
      0,
      Math.ceil((new Date(codeMutation.data.expiresAt).getTime() - now) / 1000)
    );
  }, [codeMutation.data, now]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/30 p-1.5">
        <Button
          variant={purpose === "CHECK_IN" ? "default" : "ghost"}
          onClick={() => {
            setPurpose("CHECK_IN");
            codeMutation.reset();
          }}
        >
          <LogIn className="ml-2 h-4 w-4" />
          QR ورود
        </Button>
        <Button
          variant={purpose === "CHECK_OUT" ? "default" : "ghost"}
          onClick={() => {
            setPurpose("CHECK_OUT");
            codeMutation.reset();
          }}
        >
          <LogOut className="ml-2 h-4 w-4" />
          QR خروج
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <QrCode className="h-5 w-5 text-indigo-400" />
                {purpose === "CHECK_IN" ? "کد ورود شعبه" : "کد خروج شعبه"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                این QR به‌صورت خودکار کوتاه‌عمر و چرخشی است.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void qrQuery.refetch()}>
              <RefreshCw className="ml-1 h-3.5 w-3.5" />
              تازه‌سازی
            </Button>
          </div>

          <div className="mx-auto flex min-h-80 max-w-sm items-center justify-center rounded-3xl bg-white p-5">
            {qrQuery.isLoading || !qrDataUrl ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR حضور شعبه" className="h-auto w-full max-w-72" />
            )}
          </div>

          {qrQuery.isError && (
            <p className="mt-3 text-center text-xs text-red-300">{qrQuery.error.message}</p>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            {qrSecondsLeft > 0
              ? `اعتبار این QR: ${qrSecondsLeft.toLocaleString("fa-IR")} ثانیه`
              : "در حال دریافت QR جدید..."}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <KeyRound className="h-5 w-5 text-amber-400" />
              کد جایگزین مسئول
            </h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              فقط وقتی دوربین یا QR کارگر مشکل دارد یک کد یک‌بارمصرف تولید کنید.
            </p>
          </div>

          {codeMutation.data && codeSecondsLeft > 0 ? (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
              <span className="text-[11px] text-muted-foreground">کد مسئول</span>
              <div dir="ltr" className="mt-2 text-3xl font-black tracking-[0.25em] text-amber-300">
                {codeMutation.data.code}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {codeSecondsLeft.toLocaleString("fa-IR")} ثانیه تا انقضا
              </p>
            </div>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              disabled={codeMutation.isPending}
              onClick={() => codeMutation.mutate()}
            >
              {codeMutation.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="ml-2 h-4 w-4" />
              )}
              تولید کد ۶ رقمی
            </Button>
          )}

          {codeMutation.isError && (
            <p className="text-xs text-red-300">{codeMutation.error.message}</p>
          )}

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-6 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-bold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              کنترل امنیتی
            </div>
            QR یا کد به‌تنهایی کافی نیست؛ مالکیت شیفت، شعبه، وضعیت Worker، GPS، دقت مکان و Geofence نیز سمت سرور بررسی می‌شوند.
          </div>
        </section>
      </div>
    </div>
  );
}
