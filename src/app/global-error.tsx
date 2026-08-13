"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 text-center font-sans">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full space-y-4">
          <h1 className="text-xl font-bold text-rose-400">خطای بحرانی سیستم</h1>
          <p className="text-xs text-slate-400">
            {error.message || "خطای ناخواسته در ریشه برنامه رخ داده است."}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}
