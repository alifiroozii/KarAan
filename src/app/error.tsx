"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 text-center">
      <div className="h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">خطایی در بارگذاری رخ داد</h2>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        {error.message || "متأسفانه خطای غیرمنتظره‌ای رخ داده است."}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>تلاش مجدد</span>
      </button>
    </div>
  );
}
