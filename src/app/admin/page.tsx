"use client";

import React from "react";
import { ShieldCheck, Users, Briefcase, FileText } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">کارآن | پنل مدیریت ارشد (Admin)</h1>
          <p className="text-xs text-slate-400">نظارت بر سیستم، تایید هویت کاربران و بازرسی دفتر کل مالی</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل کارجویان فعال</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100">۱,۲۴۸</h2>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل شیفت‌های منتشر شده</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100">۳,۵۶۰</h2>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>گزارش رویدادهای مالی (Audit)</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100">۱۰,۹۲۰</h2>
        </div>
      </div>
    </div>
  );
}
