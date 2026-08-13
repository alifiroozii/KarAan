import React from "react";
import { Loader2 } from "lucide-react";

export default function WorkerLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
      <span className="text-xs text-slate-400 font-medium">در حال دریافت شیفت‌های فعال...</span>
    </div>
  );
}
