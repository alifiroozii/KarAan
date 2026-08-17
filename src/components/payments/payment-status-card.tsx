"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleX, Clock3, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/domain-displays";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";

interface PaymentView {
  paymentId: string;
  payerUserId: string;
  amountRials: string;
  purpose: "WALLET_TOPUP" | "SHIFT_PREFUND";
  description: string;
  provider: "MOCK" | "ZARINPAL" | "SAMAN";
  paymentUrl: string | null;
  refId: string | null;
  providerMessage: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  verifiedAt: string | null;
  idempotent: boolean;
  walletMutationDeferred: true;
}

async function fetchPayment(paymentId: string): Promise<PaymentView> {
  const response = await fetch(`/api/payments/${paymentId}`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "دریافت وضعیت پرداخت ناموفق بود.");
  }
  return body.data as PaymentView;
}

export function PaymentStatusCard({ paymentId }: { paymentId: string }) {
  const query = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => fetchPayment(paymentId),
    refetchInterval: (state) => state.state.data?.status === "PENDING" ? 15_000 : false,
  });

  useRealtimeRoom("user", query.data?.payerUserId);

  if (query.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> در حال بررسی وضعیت پرداخت...
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        {query.error?.message ?? "پرداخت در دسترس نیست."}
      </div>
    );
  }

  const payment = query.data;
  const statusMeta = payment.status === "SUCCESS"
    ? { icon: CheckCircle2, title: "پرداخت تایید شد", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" }
    : payment.status === "FAILED"
      ? { icon: CircleX, title: "پرداخت ناموفق بود", className: "border-red-500/30 bg-red-500/10 text-red-200" }
      : { icon: Clock3, title: "پرداخت در انتظار تایید", className: "border-amber-500/30 bg-amber-500/10 text-amber-200" };
  const Icon = statusMeta.icon;

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className={`rounded-2xl border p-4 ${statusMeta.className}`}>
        <div className="flex items-center gap-2 font-extrabold">
          <Icon className="h-5 w-5" /> {statusMeta.title}
        </div>
        {payment.providerMessage && (
          <p className="mt-2 text-xs leading-6 opacity-80">{payment.providerMessage}</p>
        )}
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-4">
          <div className="text-xs text-muted-foreground">مبلغ</div>
          <div className="mt-2 font-bold"><CurrencyDisplay amountRials={BigInt(payment.amountRials)} /></div>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <div className="text-xs text-muted-foreground">درگاه</div>
          <div className="mt-2 font-bold">{payment.provider}</div>
        </div>
        <div className="rounded-2xl border border-border p-4 sm:col-span-2">
          <div className="text-xs text-muted-foreground">شرح</div>
          <div className="mt-2 font-bold">{payment.description}</div>
        </div>
        {payment.refId && (
          <div className="rounded-2xl border border-border p-4 sm:col-span-2">
            <div className="text-xs text-muted-foreground">شماره مرجع درگاه</div>
            <div className="mt-2 font-mono font-bold" dir="ltr">{payment.refId}</div>
          </div>
        )}
      </div>

      {payment.status === "PENDING" && payment.paymentUrl && (
        <Button asChild className="w-full">
          <a href={payment.paymentUrl} rel="noreferrer">
            ادامه پرداخت در درگاه <ExternalLink className="mr-2 h-4 w-4" />
          </a>
        </Button>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs leading-6 text-sky-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        این مرحله فقط نتیجه درگاه را ثبت می‌کند. افزایش موجودی کیف پول و ثبت Ledger در Prompt 31 انجام می‌شود و این Callback مستقیماً موجودی را تغییر نمی‌دهد.
      </div>
    </section>
  );
}
