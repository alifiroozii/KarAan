import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 text-center">
      <div className="h-16 w-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-100 mb-2">۴۰۴ - صفحه یافت نشد</h1>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
      >
        <span>بازگشت به صفحه اصلی</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}
