"use client";

import { useState } from "react";
import { Loader2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreatedPayment {
  paymentId: string;
  paymentUrl: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
}

function newKey() {
  return `topup-${crypto.randomUUID()}`;
}

export function PaymentTopupForm() {
  const [amountToman, setAmountToman] = useState("500000");
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const normalized = amountToman.replace(/[,،\s]/g, "");
    if (!/^\d+$/.test(normalized) || BigInt(normalized) <= 0n) {
      setError("مبلغ را به تومان و فقط به صورت عدد وارد کنید.");
      return;
    }

    setPending(true);
    try {
      const amountRials = BigInt(normalized) * 10n;
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ amountRials: amountRials.toString() }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body?.error?.message ?? "ایجاد پرداخت ناموفق بود.");
      }
      const payment = body.data as CreatedPayment;
      if (!payment.paymentUrl) {
        throw new Error("آدرس درگاه برای این پرداخت ایجاد نشده است.");
      }
      window.location.assign(payment.paymentUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ایجاد پرداخت ناموفق بود.");
      setPending(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-7 space-y-5">
      <div className="flex items-center gap-2">
        <WalletCards className="h-5 w-5 text-emerald-400" />
        <div>
          <h2 className="font-extrabold">ایجاد پرداخت</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            مبلغ به تومان وارد می‌شود؛ رکورد مالی داخلی همچنان با ریال ذخیره می‌شود.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold">مبلغ شارژ به تومان</label>
        <Input
          inputMode="numeric"
          value={amountToman}
          onChange={(event) => {
            setAmountToman(event.target.value);
            setIdempotencyKey(newKey());
          }}
          placeholder="مثلاً 500000"
          dir="ltr"
        />
      </div>

      <Button className="w-full" disabled={pending} onClick={submit}>
        {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        رفتن به درگاه پرداخت
      </Button>
      {error && <p className="text-xs text-red-300">{error}</p>}

      <p className="text-[11px] leading-6 text-muted-foreground">
        تایید موفق درگاه در این مرحله فقط Payment را SUCCESS می‌کند؛ موجودی Wallet هنوز تغییر نمی‌کند.
      </p>
    </section>
  );
}
