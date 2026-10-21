"use client";

import React from "react";
import { useAdmin } from "./admin-context";
import { AdminProjectManagement } from "./admin-project-management";
import { AdminUserManagement } from "./admin-user-management";
import { AdminOverview } from "./admin-overview";
import { AdminAuditLog } from "./admin-audit-log";
import { Briefcase, Users, BarChart3, ShieldCheck } from "lucide-react";

export function AdminMainView() {
  const { activeTab, setActiveTab } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Top Segmented Tabs Bar (Google Stitch Workspace Switcher) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "projects"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>مدیریت پروژه‌ها و سفارشات</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "users"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>دایرکتوری کاربران و متخصصان</span>
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>دیده‌بان کلان تله‌متری</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "audit"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>رویدادهای امنیتی و ممیزی</span>
        </button>
      </div>

      {/* Active Tab Canvas */}
      {activeTab === "projects" && <AdminProjectManagement />}
      {activeTab === "users" && <AdminUserManagement />}
      {activeTab === "overview" && <AdminOverview />}
      {activeTab === "audit" && <AdminAuditLog />}
    </div>
  );
}
