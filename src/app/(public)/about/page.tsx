import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 text-center max-w-3xl mx-auto space-y-6">
      <div className="h-16 w-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100">درباره کارآن</h1>
      <p className="text-slate-400 text-sm leading-relaxed">
        کارآن پلتفرم جامع زیرساختی تامین نیروی کار ساعتی و شیفتی در ایران است. این سامانه با هدف حذف واسطه‌گری، ایجاد شفافیت مالی از طریق سپرده امن (Escrow) و اعتبارسنجی دقیق حضوروغیاب با GPS ایجاد شده است.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
      >
        <span>صفحه اصلی</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}
