"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  LogOut,
  Sparkles,
  Users,
  Briefcase,
  BarChart3,
  Search,
  Menu,
  X,
  PlusCircle,
  RotateCw,
  Layers,
  Cpu,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AdminProvider, useAdmin, type AdminTab } from "@/components/admin/admin-context";

function AdminDashboardInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminUser, setAdminUser] = useState<string>("admin@karaan.ir");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setIsCreateProjectOpen,
    pendingProjectsCount,
    totalUsersCount,
  } = useAdmin();

  useEffect(() => {
    // Enforce pure light theme across the admin experience
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";

    // Check if admin is authenticated
    fetch("/api/admin/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.data?.authenticated) {
          router.replace("/admin/login");
        } else if (data?.data?.username) {
          setAdminUser(data.data.username);
        }
      })
      .catch(() => {
        // network issue fallback
      });
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems: { id: AdminTab; label: string; sub: string; icon: typeof Briefcase; badge?: number }[] = [
    {
      id: "projects",
      label: "پروژه‌ها و سفارشات",
      sub: "سفارشات وب و اپلیکیشن",
      icon: Briefcase,
      badge: pendingProjectsCount > 0 ? pendingProjectsCount : undefined,
    },
    {
      id: "users",
      label: "دایرکتوری کاربران",
      sub: "کارجویان و کارفرمایان",
      icon: Users,
      badge: totalUsersCount > 0 ? totalUsersCount : undefined,
    },
    {
      id: "overview",
      label: "دیده‌بان تله‌متری",
      sub: "پایش لحظه‌ای سیستم",
      icon: BarChart3,
    },
    {
      id: "audit",
      label: "رویدادها و ممیزی",
      sub: "لاگ‌های امنیتی و دسترسی",
      icon: ShieldCheck,
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50/70 text-slate-900 flex font-sans selection:bg-blue-500 selection:text-white"
    >
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Google Stitch Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 flex w-72 flex-col border-l border-slate-200 bg-white shadow-xs transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5">
          <div className="flex items-center gap-3">
            {/* Karjoor Infinity Synergy Logo (Designed with Gemini - No Latin 'K') */}
            <img
              src="/karjoor-logo.png"
              alt="لوگوی کارجور"
              className="h-10 w-10 rounded-xl object-cover shadow-sm border border-slate-100"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-slate-900 tracking-tight">کارجور</h1>
                <span className="rounded-md bg-blue-100/70 border border-blue-200 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                  Google Stitch
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">سامانه مدیریت، عملیات و تله‌متری</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Selector Badge */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">محیط Vercel Production</span>
            </div>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500">
              Live Edge
            </span>
          </div>
        </div>

        {/* Primary Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            بخش‌های اصلی داشبورد
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200/70 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-right">
                    <span className="block leading-tight">{item.label}</span>
                    <span className="block text-[10px] font-normal text-slate-400">{item.sub}</span>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black font-mono ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.badge.toLocaleString("fa-IR")}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Stitch Tool CTA */}
          <div className="pt-4 px-1">
            <button
              onClick={() => {
                setIsCreateProjectOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 px-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ ثبت سفارش / پروژه جدید</span>
            </button>
          </div>

          {/* System Telemetry Specs */}
          <div className="pt-6 px-2 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-600 font-medium">سرور ابری Vercel:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                آنلاین
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-600 font-medium">پایگاه داده و استور:</span>
              <span className="font-mono text-blue-600 font-bold">Drizzle ORM</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-600 font-medium">تله‌متری اندروید:</span>
              <span className="font-bold text-indigo-600">Dual Sync</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Admin Profile & Logout */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/50">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-black text-xs">
                {adminUser.slice(0, 1).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-black text-slate-900 truncate">{adminUser}</span>
                <span className="block text-[10px] text-emerald-600 font-bold">سوپر ادمین سامانه</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
              title="خروج از حساب مدیریت"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area (Top Bar + Dynamic Canvas) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Google Search Bar Style */}
            <div className="relative w-64 sm:w-80 md:w-96">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در سفارش‌ها، پروژه‌ها، کاربران، تلفن یا شهر..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-9 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden transition shadow-2xs"
              />
            </div>
          </div>

          {/* Header Actions & Telemetry Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              اتصال همگام Vercel
            </span>

            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>ثبت سفارش جدید</span>
            </button>
          </div>
        </header>

        {/* Dynamic Canvas Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>داشبورد ابری کارجور (طراحی شده بر اساس الگوی رسمی Google Stitch)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              امنیت ارتباطات TLS • ذخیره‌سازی ابری ایمن • اتصال بلادرنگ به اپلیکیشن اندروید
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminDashboardInner>{children}</AdminDashboardInner>
    </AdminProvider>
  );
}
