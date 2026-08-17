"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BanknoteArrowDown, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/domain-displays";

interface PayoutView {
  payoutId: string;
  amountRials: string;
  bankIbanMasked: string;
  trackingNumber: string | null;
  status: "PENDING" | "PROCESSING" | "DONE" | "REJECTED";
  requestedAt: string;
  processedAt: string | null;
  bankTransferDeferred: boolean;
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "عملیات برداشت ناموفق بود.");
  }
  return body.data as T;
}

export function PayoutRequestCard() {
  const queryClient = useQueryClient();
  const [amountToman, setAmountToman] = useState("");
  const retryKey = useRef<string | null>(null);

  const payouts = useQuery({
    queryKey: ["payouts"],
    queryFn: async () => readResult<PayoutView[]>(await fetch("/api/payouts", { cache: "no-store" })),
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      const normalized = amountToman.replace(/[,٬\s]/g, "");
      if (!/^\d+$/.test(normalized)) throw new Error("مبلغ برداشت را به تومان و عدد صحیح وارد کنید.");
      const amountRials = BigInt(normalized) * 10n;
      if (amountRials <= 0n) throw new Error("مبلغ برداشت باید بیشتر از صفر باشد.");
      if (!retryKey.current) retryKey.current = `payout-${crypto.randomUUID()}`;
      return readResult<PayoutView>(
        await fetch("/api/payouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": retryKey.current,
          },
          body: JSON.stringify({ amountRials: amountRials.toString() }),
        })
      );
    },
    onSuccess: () => {
      retryKey.current = null;
      setAmountToman("");
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });

  const recent = payouts.data?.slice(0, 3) ?? [];

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <BanknoteArrowDown className="h-5 w-5 text-emerald-400" /> درخواست برداشت
        </h2>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          مبلغ پس از ثبت درخواست از موجودی قابل استفاده رزرو می‌شود تا دوباره خرج نشود. انتقال بانکی در این مرحله خودکار اجرا نمی‌شود.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold">مبلغ برداشت (تومان)</label>
        <Input
          inputMode="numeric"
          value={amountToman}
          onChange={(event) => {
            setAmountToman(event.target.value);
            retryKey.current = null;
          }}
          placeholder="مثلاً ۵۰۰۰۰۰"
          dir="ltr"
        />
        <Button
          className="w-full"
          disabled={!amountToman.trim() || requestPayout.isPending}
          onClick={() => requestPayout.mutate()}
        >
          {requestPayout.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          ثبت درخواست برداشت
        </Button>
        {requestPayout.error && (
          <p className="text-xs leading-6 text-red-300">{requestPayout.error.message}</p>
        )}
        {requestPayout.isSuccess && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-200">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0" />
            درخواست ثبت شد و مبلغ در Ledger رزرو شد. وضعیت انتقال بانکی هنوز PENDING است.
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <div className="text-xs font-bold text-muted-foreground">درخواست‌های اخیر</div>
          {recent.map((item) => (
            <div key={item.payoutId} className="rounded-2xl border border-border p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <strong><CurrencyDisplay amountRials={BigInt(item.amountRials)} /></strong>
                <span className="rounded-full border border-border px-2 py-1 text-[10px]">{item.status}</span>
              </div>
              <div className="mt-2 text-muted-foreground" dir="ltr">{item.bankIbanMasked}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
