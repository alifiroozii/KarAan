"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-10 text-center space-y-4">
      <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
      <h2 className="text-lg font-bold text-slate-100">خطا در بارگذاری پنل مدیریت</h2>
      <p className="text-xs text-slate-400">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
