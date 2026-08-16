import React from "react";
import { Star, ShieldCheck, TrendingUp } from "lucide-react";
import { formatMoneyRials } from "@/lib/money";
import { formatToJalali } from "@/lib/date";
import { Badge } from "./display-elements";

export function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-medium">{title}</span>
        <div className="h-9 w-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-100">{value}</h3>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </span>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "منتظر بررسی",
  APPROVED: "تأییدشده",
  READY_FOR_SETTLEMENT: "آماده تسویه",
  SETTLED: "تسویه‌شده",
  DISPUTED: "دارای اختلاف",
  ADJUSTMENT_REQUIRED: "نیازمند اصلاح",
  VOID: "باطل‌شده",
};

export function StatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status) {
      case "SETTLED":
      case "APPROVED":
      case "READY_FOR_SETTLEMENT":
      case "PUBLISHED":
        return "emerald";
      case "CHECKED_IN":
      case "WORKING":
      case "IN_PROGRESS":
        return "indigo";
      case "ON_BREAK":
      case "RECONFIRMED":
      case "ADJUSTMENT_REQUIRED":
        return "amber";
      case "CANCELLED":
      case "DISPUTED":
      case "VOID":
        return "rose";
      default:
        return "secondary";
    }
  };

  return <Badge variant={getVariant()}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function RatingStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= score
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-800 text-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export function ReliabilityBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-sm">
      <ShieldCheck className="w-4 h-4 text-emerald-400" />
      <span>اعتبار: {score.toFixed(1)}٪</span>
    </div>
  );
}

export function CurrencyDisplay({ amountRials }: { amountRials: bigint | number }) {
  return (
    <span className="font-bold text-slate-100">
      {formatMoneyRials(amountRials)}
    </span>
  );
}

export function PersianDateDisplay({ date }: { date: Date | string }) {
  return <span className="text-xs text-slate-400">{formatToJalali(date)}</span>;
}
