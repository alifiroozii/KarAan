"use client";

import React from "react";
import { useAdmin } from "./admin-context";
import { AdminProjectManagement } from "./admin-project-management";
import { AdminUserManagement } from "./admin-user-management";
import { AdminOverview } from "./admin-overview";
import { AdminAuditLog } from "./admin-audit-log";
import { Briefcase, Users, BarChart3, ShieldCheck, Sparkles } from "lucide-react";

export function AdminMainView() {
  const { activeTab, setActiveTab, pendingProjectsCount, totalUsersCount } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Stitch Context Breadcrumb & Tab Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              {activeTab === "projects" && "مدیریت پروژه‌ها، سفارش‌ها و ره‌گیری میدانی"}
              {activeTab === "users" && "دایرکتوری یکپارچه کاربران و متخصصان کارجور"}
              {activeTab === "overview" && "دیده‌بان تحلیلی و مانیتورینگ کلان تله‌متری"}
              {activeTab === "audit" && "ثبت وقایع، لاگ‌های امنیتی و دسترسی‌های سیستمی"}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">طراحی شده بر پایه متریال ۳ و معماری Google Stitch</p>
          </div>
        </div>

        {/* Quick Segmented Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/70 shadow-2xs">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "projects"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>پروژه‌ها</span>
            {pendingProjectsCount > 0 && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-black text-blue-700">
                {pendingProjectsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>کاربران</span>
            {totalUsersCount > 0 && (
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-black text-slate-700">
                {totalUsersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>دیده‌بان</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "audit"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>لاگ و ممیزی</span>
          </button>
        </div>
      </div>

      {/* Active Tab Canvas */}
      {activeTab === "projects" && <AdminProjectManagement />}
      {activeTab === "users" && <AdminUserManagement />}
      {activeTab === "overview" && <AdminOverview />}
      {activeTab === "audit" && <AdminAuditLog />}
    </div>
  );
}
