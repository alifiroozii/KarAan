"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "./admin-context";
import {
  Users,
  Smartphone,
  Mail,
  FileText,
  ShieldAlert,
  Search,
  RefreshCw,
  UserRound,
  Building2,
  CheckCircle2,
  Ban,
  RotateCcw,
  Eye,
  X,
  Copy,
  Check,
  Cpu,
  MapPin,
  Clock,
  Briefcase,
  Sparkles,
  Download,
  Calendar,
  Layers,
  Globe,
} from "lucide-react";

interface UserSubmittedRequest {
  id: string;
  title: string;
  category: string;
  budget: string;
  city: string;
  address?: string;
  createdAt: string;
  status: "ACTIVE" | "APPROVED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;
  details?: string;
  updatedAt?: string;
  approvedAt?: string;
  notes?: string;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: "WORKER" | "EMPLOYER" | "ADMIN" | string;
  avatarUrl?: string | null;
  platform: "ANDROID" | "WEB" | "IOS";
  deviceModel?: string;
  appVersion?: string;
  ipAddress?: string;
  isVerified: boolean;
  isBlocked: boolean;
  provider: "GMAIL" | "PHONE_OTP" | "ADMIN_SEED";
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  city?: string;
  skills?: string[];
  submittedRequests?: UserSubmittedRequest[];
  notes?: string;
}

interface OverviewData {
  totalUsers: number;
  workers: number;
  employers: number;
  mobileUsers: number;
  gmailUsers: number;
  blockedUsers: number;
  totalRequestsCount: number;
  activeUsersToday: number;
  generatedAt: string;
}

async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch("/api/admin/overview", { cache: "no-store" });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message || "دریافت آمار ناموفق بود.");
  return body.data as OverviewData;
}

async function fetchUsersList(): Promise<UserItem[]> {
  const res = await fetch("/api/admin/users?limit=100", { cache: "no-store" });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message || "دریافت لیست کاربران ناموفق بود.");
  return (body.data?.items || []) as UserItem[];
}

export function AdminUserManagement() {
  const queryClient = useQueryClient();
  const { searchQuery: globalSearch, setTotalUsersCount } = useAdmin();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "ANDROID" | "WORKER" | "EMPLOYER" | "GMAIL" | "WITH_REQUESTS" | "BLOCKED"
  >("ALL");

  const effectiveSearch = globalSearch || localSearchQuery;

  // Selected user for Deep Inspector Modal
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"PROFILE" | "DEVICE" | "REQUESTS" | "JSON">("PROFILE");
  const [copiedId, setCopiedId] = useState(false);

  // Queries
  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: fetchOverview,
    refetchInterval: 8_000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "list"],
    queryFn: fetchUsersList,
    refetchInterval: 8_000,
  });

  useEffect(() => {
    if (overviewQuery.data?.totalUsers !== undefined) {
      setTotalUsersCount(overviewQuery.data.totalUsers);
    }
  }, [overviewQuery.data?.totalUsers, setTotalUsersCount]);

  // Block/Unblock Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: !isBlocked, reason: "تغییر وضعیت مستقیم توسط مدیر ارشد سامانه" }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message || "خطا در تغییر وضعیت کاربر");
      return body.data;
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      if (selectedUser && selectedUser.id === vars.userId) {
        setSelectedUser((prev) => (prev ? { ...prev, isBlocked: !vars.isBlocked } : null));
      }
    },
  });

  // Request Status Mutation (Approval / Completion / Cancellation)
  const requestStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message || "خطا در تغییر وضعیت درخواست");
      return body.data;
    },
    onSuccess: (updatedReq: any) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      if (selectedUser) {
        setSelectedUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            submittedRequests: prev.submittedRequests?.map((r) =>
              r.id === updatedReq.id ? { ...r, ...updatedReq } : r
            ),
          };
        });
      }
    },
  });

  // User Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message || "خطا در تغییر وضعیت تأیید کاربر");
      return body.data;
    },
    onSuccess: (updatedUser: any) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      if (selectedUser && selectedUser.id === updatedUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, isVerified: updatedUser.isVerified } : null));
      }
    },
  });

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    const list = usersQuery.data || [];
    return list.filter((user) => {
      // Search matching
      if (effectiveSearch.trim()) {
        const q = effectiveSearch.toLowerCase().trim();
        const matchesSearch =
          user.fullName?.toLowerCase().includes(q) ||
          user.phone?.includes(q) ||
          user.email?.toLowerCase().includes(q) ||
          user.city?.toLowerCase().includes(q) ||
          user.deviceModel?.toLowerCase().includes(q) ||
          user.skills?.some((s) => s.toLowerCase().includes(q)) ||
          user.submittedRequests?.some((r) => r.title.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Filter matching
      if (activeFilter === "ANDROID") return user.platform === "ANDROID";
      if (activeFilter === "WORKER") return user.role === "WORKER";
      if (activeFilter === "EMPLOYER") return user.role === "EMPLOYER";
      if (activeFilter === "GMAIL") return user.provider === "GMAIL" || user.email?.includes("@");
      if (activeFilter === "WITH_REQUESTS") return (user.submittedRequests?.length || 0) > 0;
      if (activeFilter === "BLOCKED") return user.isBlocked;

      return true;
    });
  }, [usersQuery.data, effectiveSearch, activeFilter]);

  const overview = overviewQuery.data || {
    totalUsers: usersQuery.data?.length || 0,
    workers: usersQuery.data?.filter((u) => u.role === "WORKER").length || 0,
    employers: usersQuery.data?.filter((u) => u.role === "EMPLOYER").length || 0,
    mobileUsers: usersQuery.data?.filter((u) => u.platform === "ANDROID").length || 0,
    gmailUsers: usersQuery.data?.filter((u) => u.provider === "GMAIL" || u.email?.includes("@")).length || 0,
    blockedUsers: usersQuery.data?.filter((u) => u.isBlocked).length || 0,
    totalRequestsCount: usersQuery.data?.reduce((acc, u) => acc + (u.submittedRequests?.length || 0), 0) || 0,
    activeUsersToday: usersQuery.data?.length || 0,
    generatedAt: new Date().toISOString(),
  };

  const [clearingFakes, setClearingFakes] = useState(false);
  const handleClearFakes = async () => {
    if (!confirm("آیا از پاکسازی کلیه داده‌های آزمایشی و باقی‌ماندن تنها حساب ادمین ارشد اطمینان دارید؟")) return;
    setClearingFakes(true);
    try {
      await fetch("/api/admin/users", { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    } finally {
      setClearingFakes(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usersQuery.data || [], null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `karaan_users_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              مرکز مدیریت و مانیتورینگ متمرکز کاربران
            </h2>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold">
              تله‌متری زنده
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            فهرست تمامی کاربرانی که اپلیکیشن را نصب کرده، لاگین نموده‌اند یا درخواست کار ثبت کرده‌اند با ریز اطلاعات ارسالی.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => {
              void usersQuery.refetch();
              void overviewQuery.refetch();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${usersQuery.isFetching ? "animate-spin text-indigo-500" : ""}`} />
            <span>بروزرسانی زنده</span>
          </button>

          <button
            onClick={handleClearFakes}
            disabled={clearingFakes}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 shadow-xs cursor-pointer"
            title="پاکسازی تمام کاربران فیک و آزمایشی"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${clearingFakes ? "animate-spin" : ""}`} />
            <span>پاکسازی فیک‌ها</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>خروجی JSON</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Users */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">کل کاربران ثبت‌شده</span>
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-2 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {overview.totalUsers.toLocaleString("fa-IR")}
          </strong>
          <span className="text-[11px] text-slate-400">نصب اپ و حساب وب</span>
        </div>

        {/* Mobile APK Users */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">کاربران اپ اندروید (APK)</span>
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-2 text-sky-600">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {overview.mobileUsers.toLocaleString("fa-IR")}
          </strong>
          <span className="text-[11px] text-slate-400">متصل از فایل karan.apk</span>
        </div>

        {/* Gmail Auth Users */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">لاگین با حساب گوگل (Gmail)</span>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-rose-600">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {overview.gmailUsers.toLocaleString("fa-IR")}
          </strong>
          <span className="text-[11px] text-slate-400">ورود بدون رمز با جیمیل</span>
        </div>

        {/* Submitted Requests */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">درخواست‌های ارسالی کاربران</span>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-amber-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {overview.totalRequestsCount.toLocaleString("fa-IR")}
          </strong>
          <span className="text-[11px] text-slate-400">سفارش و نیازمندی ثبت‌شده</span>
        </div>

        {/* Blocked Accounts */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">حساب‌های مسدود شده</span>
            <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-red-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {overview.blockedUsers.toLocaleString("fa-IR")}
          </strong>
          <span className="text-[11px] text-slate-400">عدم دسترسی به سامانه</span>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="space-y-3 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={effectiveSearch}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="جست‌وجو در نام، شماره موبایل، آدرس جیمیل، شهر، مدل دستگاه یا مهارت‌ها..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
          />
          {effectiveSearch && (
            <button
              onClick={() => setLocalSearchQuery("")}
              className="absolute left-3.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-bold text-slate-500 ml-1">فیلتر نمایش:</span>

          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            همه کاربران ({overview.totalUsers})
          </button>

          <button
            onClick={() => setActiveFilter("ANDROID")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "ANDROID"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>📱 اپلیکیشن اندروید ({overview.mobileUsers})</span>
          </button>

          <button
            onClick={() => setActiveFilter("WORKER")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "WORKER"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <UserRound className="h-3.5 w-3.5" />
            <span>متخصصان و کارجویان ({overview.workers})</span>
          </button>

          <button
            onClick={() => setActiveFilter("EMPLOYER")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "EMPLOYER"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>کارفرمایان و متقاضیان ({overview.employers})</span>
          </button>

          <button
            onClick={() => setActiveFilter("GMAIL")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "GMAIL"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>لاگین با جیمیل ({overview.gmailUsers})</span>
          </button>

          <button
            onClick={() => setActiveFilter("WITH_REQUESTS")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "WITH_REQUESTS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>دارای درخواست فعال</span>
          </button>

          <button
            onClick={() => setActiveFilter("BLOCKED")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === "BLOCKED"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>مسدود شده ({overview.blockedUsers})</span>
          </button>
        </div>
      </div>

      {/* 4. Comprehensive Users & Requests Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3.5 px-4 font-semibold">کاربر / مشخصات هویتی</th>
                <th className="py-3.5 px-4 font-semibold">نقش در سامانه</th>
                <th className="py-3.5 px-4 font-semibold">تماس و احراز هویت</th>
                <th className="py-3.5 px-4 font-semibold">دستگاه و پلتفرم</th>
                <th className="py-3.5 px-4 font-semibold">درخواست‌های ارسالی</th>
                <th className="py-3.5 px-4 font-semibold">آخرین فعالیت</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات مدیریت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    کاربری با این مشخصات یا فیلتر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isWorker = user.role === "WORKER";
                  const isEmployer = user.role === "EMPLOYER";
                  const hasGmail = user.provider === "GMAIL" || (user.email && user.email.includes("@"));
                  const requestsCount = user.submittedRequests?.length || 0;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black text-sm shadow-xs">
                            {user.fullName ? user.fullName[0] : "ک"}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 text-xs sm:text-sm">
                              {user.fullName}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {user.id.slice(0, 14)}
                              </span>
                              {user.city && (
                                <span className="text-[10px] text-slate-500 font-medium mr-1">
                                  • {user.city.split(" ")[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {isWorker && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            <UserRound className="h-3 w-3" />
                            <span>متخصص / کارجو</span>
                          </span>
                        )}
                        {isEmployer && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <Building2 className="h-3 w-3" />
                            <span>کارفرما / متقاضی</span>
                          </span>
                        )}
                        {!isWorker && !isEmployer && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                            مدیر سامانه
                          </span>
                        )}
                      </td>

                      {/* Contact & Auth */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {hasGmail ? (
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                              <span className="rounded bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold">
                                Gmail
                              </span>
                              <span>{user.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">بدون جیمیل</span>
                          )}
                          <span className="block text-[11px] text-slate-600 font-mono">
                            {user.phone}
                          </span>
                        </div>
                      </td>

                      {/* Device & Platform */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {user.platform === "ANDROID" ? (
                              <>
                                <Smartphone className="h-3 w-3 text-sky-500" />
                                <span>📱 اندروید (APK)</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 text-indigo-500" />
                                <span>💻 پنل تحت وب</span>
                              </>
                            )}
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">
                            {user.deviceModel || "دستگاه پیش‌فرض"}
                          </span>
                        </div>
                      </td>

                      {/* Submitted Requests */}
                      <td className="py-3.5 px-4">
                        {requestsCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold">
                              <FileText className="h-3 w-3" />
                              <span>{requestsCount} درخواست ثبت‌شده</span>
                            </span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">
                              {user.submittedRequests?.[0]?.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">بدون درخواست فعال</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] dir-ltr text-right">
                        {new Date(user.lastLoginAt || user.createdAt).toLocaleDateString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                            مسدود
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>فعال</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Full Inspector */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setInspectorTab("PROFILE");
                            }}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="مشاهده پرونده کامل و تله‌متری کاربر"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>شناسنامه</span>
                          </button>

                          {/* Block/Unblock Button */}
                          <button
                            onClick={() =>
                              statusMutation.mutate({ userId: user.id, isBlocked: user.isBlocked })
                            }
                            className={`p-1.5 rounded-xl border transition cursor-pointer ${
                              user.isBlocked
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                            title={user.isBlocked ? "رفع مسدودی" : "مسدودسازی کاربر"}
                          >
                            {user.isBlocked ? (
                              <RotateCcw className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Deep Inspector Modal / Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-lg shadow-md">
                  {selectedUser.fullName ? selectedUser.fullName[0] : "ک"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {selectedUser.fullName}
                    </h3>
                    {selectedUser.isBlocked ? (
                      <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        مسدود شده
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        حساب فعال
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    شناسنامه جامع و کلیه اطلاعات ارسال‌شده توسط کاربر
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 pt-3 bg-white">
              <button
                onClick={() => setInspectorTab("PROFILE")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectorTab === "PROFILE"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                مشخصات فردی و هویتی
              </button>
              <button
                onClick={() => setInspectorTab("DEVICE")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectorTab === "DEVICE"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                دستگاه و تله‌متری
              </button>
              <button
                onClick={() => setInspectorTab("REQUESTS")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectorTab === "REQUESTS"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                درخواست‌ها ({selectedUser.submittedRequests?.length || 0})
              </button>
              <button
                onClick={() => setInspectorTab("JSON")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  inspectorTab === "JSON"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                داده خام JSON
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* TAB 1: PROFILE */}
              {inspectorTab === "PROFILE" && (
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">شناسه یکتا کاربر (UUID):</span>
                    <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                      <span className="truncate">{selectedUser.id}</span>
                      <button
                        onClick={() => handleCopyId(selectedUser.id)}
                        className="p-1 text-slate-400 hover:text-indigo-500"
                        title="کپی شناسه"
                      >
                        {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">نقش ثبت‌شده:</span>
                    <strong className="text-slate-800 block text-xs">
                      {selectedUser.role === "WORKER" ? "متخصص و کارجو (انجام‌دهنده کار)" : "کارفرما و درخواست‌کننده نیرو"}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">آدرس جیمیل (Google Auth):</span>
                    <strong className="text-slate-800 block font-mono">
                      {selectedUser.email || "ثبت نشده"}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">شماره تلفن همراه:</span>
                    <strong className="text-slate-800 block font-mono">
                      {selectedUser.phone}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1 sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">شهر و موقعیت مکانی:</span>
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <MapPin className="h-4 w-4 text-rose-500" />
                      <span>{selectedUser.city || "تهران"}</span>
                    </div>
                  </div>

                  {selectedUser.skills && selectedUser.skills.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 p-3.5 space-y-2 sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">مهارت‌ها و تخصص‌های اعلامی:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.notes && (
                    <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1 sm:col-span-2 bg-slate-50">
                      <span className="text-slate-400 block text-[11px]">یادداشت سیستمی:</span>
                      <p className="text-slate-700 text-xs">{selectedUser.notes}</p>
                    </div>
                  )}

                  {/* IDENTITY VERIFICATION CARD */}
                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-2 sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/20">
                    <div>
                      <span className="text-slate-400 block text-[11px]">وضعیت تأیید مدارک و احراز هویت:</span>
                      <strong className="text-xs flex items-center gap-1.5 mt-0.5">
                        {selectedUser.isVerified ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> تأیید هویت شده (دارای نشان اصالت کاروین)
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Clock className="w-4 h-4" /> در انتظار بررسی مدارک
                          </span>
                        )}
                      </strong>
                    </div>
                    <button
                      disabled={verifyMutation.isPending}
                      onClick={() =>
                        verifyMutation.mutate({
                          userId: selectedUser.id,
                          isVerified: !selectedUser.isVerified,
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        selectedUser.isVerified
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedUser.isVerified ? "لغو تأیید هویت" : "✓ تأیید مدارک و احراز هویت"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DEVICE & TELEMETRY */}
              {inspectorTab === "DEVICE" && (
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">پلتفرم کاربر:</span>
                    <strong className="text-slate-800 block text-xs">
                      {selectedUser.platform === "ANDROID" ? "📱 اپلیکیشن اندروید (karan.apk)" : "💻 مرورگر وب / PWA"}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">مدل گوشی / سیستم کاربر:</span>
                    <strong className="text-slate-800 block text-xs">
                      {selectedUser.deviceModel || "Android Device"}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">نسخه نصب‌شده اپلیکیشن:</span>
                    <strong className="text-slate-800 block font-mono">
                      {selectedUser.appVersion || "KARJOOR v2.4.0"}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">آدرس آی‌پی (Client IP):</span>
                    <strong className="text-slate-800 block font-mono">
                      {selectedUser.ipAddress || "127.0.0.1"}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">تاریخ نصب و ثبت اولیه:</span>
                    <strong className="text-slate-800 block font-mono dir-ltr text-right">
                      {new Date(selectedUser.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-400 block text-[11px]">آخرین لاگین و اتصال به سرور:</span>
                    <strong className="text-slate-800 block font-mono dir-ltr text-right">
                      {new Date(selectedUser.lastLoginAt || selectedUser.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>
                </div>
              )}

              {/* TAB 3: SUBMITTED REQUESTS */}
              {inspectorTab === "REQUESTS" && (
                <div className="space-y-3">
                  {(!selectedUser.submittedRequests || selectedUser.submittedRequests.length === 0) ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      این کاربر هنوز درخواست یا نیازمندی کاری ثبت نکرده است.
                    </div>
                  ) : (
                    selectedUser.submittedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 text-xs sm:text-sm font-bold">
                            {req.title}
                          </strong>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              req.status === "APPROVED" || req.status === "ACCEPTED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : req.status === "COMPLETED"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : req.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                          >
                            {req.status === "APPROVED"
                              ? "✓ تأیید شده توسط مدیریت"
                              : req.status === "ACCEPTED"
                              ? "تخصیص‌یافته به مجری"
                              : req.status === "COMPLETED"
                              ? "✓ تکمیل‌شده و تسویه"
                              : req.status === "CANCELLED"
                              ? "✕ رد شده / لغو"
                              : "در انتظار بررسی و تأیید"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>دسته‌بندی: {req.category}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-bold">بودجه / دستمزد: {req.budget}</span>
                          <span>•</span>
                          <span>محل: {req.city} {req.address ? `(${req.address})` : ""}</span>
                        </div>

                        {req.details && (
                          <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                            {req.details}
                          </p>
                        )}

                        {req.notes && (
                          <div className="text-[10px] text-emerald-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-200">
                            یادداشت تأیید: {req.notes}
                          </div>
                        )}

                        {/* APPROVAL ACTION BUTTONS */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                          <span className="text-[10px] text-slate-400 font-mono dir-ltr">
                            تاریخ ثبت: {new Date(req.createdAt).toLocaleDateString("fa-IR")}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {req.status !== "APPROVED" && req.status !== "COMPLETED" && (
                              <button
                                disabled={requestStatusMutation.isPending}
                                onClick={() =>
                                  requestStatusMutation.mutate({
                                    requestId: req.id,
                                    status: "APPROVED",
                                    notes: "تأیید رسمی صلاحیت و انتشار در کاروین",
                                  })
                                }
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                تأیید و تصویب
                              </button>
                            )}

                            {req.status !== "COMPLETED" && (
                              <button
                                disabled={requestStatusMutation.isPending}
                                onClick={() =>
                                  requestStatusMutation.mutate({
                                    requestId: req.id,
                                    status: "COMPLETED",
                                    notes: "کار با موفقیت به پایان رسید و تأیید شد",
                                  })
                                }
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                تکمیل کار
                              </button>
                            )}

                            {req.status !== "CANCELLED" && (
                              <button
                                disabled={requestStatusMutation.isPending}
                                onClick={() =>
                                  requestStatusMutation.mutate({
                                    requestId: req.id,
                                    status: "CANCELLED",
                                    notes: "درخواست رد شد",
                                  })
                                }
                                className="px-2 py-1 text-[11px] font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 border border-rose-200 cursor-pointer"
                              >
                                <Ban className="w-3 h-3" />
                                رد
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: RAW JSON DATA */}
              {inspectorTab === "JSON" && (
                <div className="relative">
                  <pre className="rounded-2xl bg-slate-50 p-4 text-[11px] font-mono text-slate-800 overflow-x-auto dir-ltr text-left border border-slate-200 max-h-[300px]">
                    {JSON.stringify(selectedUser, null, 2)}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedUser, null, 2));
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>کپی JSON</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="border-t border-slate-200 p-4 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() =>
                  statusMutation.mutate({ userId: selectedUser.id, isBlocked: selectedUser.isBlocked })
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedUser.isBlocked
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-red-600 text-white hover:bg-red-500"
                }`}
              >
                {selectedUser.isBlocked ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>رفع مسدودی حساب کاربر</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-3.5 w-3.5" />
                    <span>مسدودسازی حساب کاربری</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
