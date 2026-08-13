"use client";

import React from "react";

export default function WorkerError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 text-center space-y-4">
      <h2 className="text-sm font-bold text-slate-100">خطا در بارگذاری پنل کارجو</h2>
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
