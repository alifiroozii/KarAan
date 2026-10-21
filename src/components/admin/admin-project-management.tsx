"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  Globe,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Eye,
  Check,
  X,
  PlusCircle,
  FileText,
  BadgeCheck,
  UserCheck,
  Building,
  Kanban,
  Table as TableIcon,
  Sparkles,
  LayoutGrid,
  ChevronRight,
  Wallet,
  Phone,
  User,
  AlertTriangle,
} from "lucide-react";
import { useAdmin } from "./admin-context";

interface ProjectWithUser {
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
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    platform: string;
    deviceModel: string;
    isVerified: boolean;
  };
}

interface ProjectsApiResponse {
  projects: ProjectWithUser[];
  metrics: {
    totalProjects: number;
    pendingReview: number;
    approvedAndMatching: number;
    inProgress: number;
    completed: number;
    totalEscrowToman: number;
  };
}

async function fetchProjects(q: string, status: string, category: string): Promise<ProjectsApiResponse> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "ALL") params.set("status", status);
  if (category !== "ALL") params.set("category", category);

  const res = await fetch(`/api/admin/projects?${params.toString()}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || "خطا در دریافت پروژه‌ها");
  }
  return data.data;
}

const CATEGORIES = [
  "ALL",
  "برق‌کاری",
  "لوله‌کشی",
  "نظافت",
  "تعمیرات",
  "نقاشی",
  "باغبانی",
  "امداد خودرو",
  "باربری",
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; badgeBg: string }
> = {
  ACTIVE: {
    label: "جدید / در انتظار بررسی",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeBg: "bg-amber-500",
  },
  APPROVED: {
    label: "تایید شده / آماده اعزام",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeBg: "bg-blue-500",
  },
  ACCEPTED: {
    label: "تخصیص نیرو / در مسیر",
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-500",
  },
  IN_PROGRESS: {
    label: "در حال اجرا (پوشش امانی)",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-500",
  },
  COMPLETED: {
    label: "تکمیل و تسویه شده",
    color: "text-slate-800",
    bg: "bg-slate-50",
    border: "border-slate-200",
    badgeBg: "bg-slate-500",
  },
  CANCELLED: {
    label: "لغو شده",
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badgeBg: "bg-rose-500",
  },
};

export function AdminProjectManagement() {
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery, isCreateProjectOpen, setIsCreateProjectOpen, setPendingProjectsCount } = useAdmin();

  const [localSearch, setLocalSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE" | "KANBAN">("GRID");
  const [selectedProject, setSelectedProject] = useState<ProjectWithUser | null>(null);

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    category: "تعمیرات",
    budget: "۱,۵۰۰,۰۰۰ تومان",
    city: "تهران",
    address: "",
    requesterName: "",
    requesterPhone: "",
    details: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const activeSearch = searchQuery || localSearch;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "projects", activeSearch, selectedStatus, selectedCategory],
    queryFn: () => fetchProjects(activeSearch, selectedStatus, selectedCategory),
    refetchInterval: 6000,
  });

  const projects = data?.projects || [];
  const metrics = data?.metrics || {
    totalProjects: 0,
    pendingReview: 0,
    approvedAndMatching: 0,
    inProgress: 0,
    completed: 0,
    totalEscrowToman: 0,
  };

  useEffect(() => {
    if (metrics.pendingReview !== undefined) {
      setPendingProjectsCount(metrics.pendingReview);
    }
  }, [metrics.pendingReview, setPendingProjectsCount]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData?.error?.message || "خطا در تغییر وضعیت پروژه");
      return resData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      if (selectedProject) setSelectedProject(null);
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: typeof newProjectForm) => {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData?.error?.message || "خطا در ثبت سفارش جدید");
      }
      return resData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      setIsCreateProjectOpen(false);
      setNewProjectForm({
        title: "",
        category: "تعمیرات",
        budget: "۱,۵۰۰,۰۰۰ تومان",
        city: "تهران",
        address: "",
        requesterName: "",
        requesterPhone: "",
        details: "",
      });
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const kanbanColumns = [
    { key: "ACTIVE", title: "🆕 جدید و در انتظار تایید", items: projects.filter((p) => p.status === "ACTIVE") },
    { key: "APPROVED", title: "✅ تایید شده و اعزام", items: projects.filter((p) => p.status === "APPROVED" || p.status === "ACCEPTED") },
    { key: "IN_PROGRESS", title: "⚡ در حال اجرا (امانی)", items: projects.filter((p) => p.status === "IN_PROGRESS") },
    { key: "COMPLETED", title: "🎉 تکمیل و تسویه شده", items: projects.filter((p) => p.status === "COMPLETED") },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards (Google Stitch Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects Card */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کل پروژه‌ها و سفارشات</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics.totalProjects.toLocaleString("fa-IR")}
            </span>
            <span className="text-xs font-semibold text-blue-600">پروژه ثبت‌شده</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">سفارشات ثبت‌شده از وب و اپلیکیشن کارجور</p>
        </div>

        {/* Total Escrow Capital Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">حجم سرمایه امانی محافظت‌شده</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">
              {metrics.totalEscrowToman.toLocaleString("fa-IR")}
            </span>
            <span className="text-xs font-bold text-emerald-700">تومان</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">سپرده در حساب امانی کارجور (Escrow)</p>
        </div>

        {/* Pending Review Card */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">در انتظار بررسی و نظارت</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900 tracking-tight">
              {metrics.pendingReview.toLocaleString("fa-IR")}
            </span>
            <span className="text-xs font-bold text-amber-700">نیاز به اقدام</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">درخواست‌های تازه جهت تایید صلاحیت و تخصیص</p>
        </div>

        {/* Active & In Progress Card */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">در حال اجرا با متخصص</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-900 tracking-tight">
              {metrics.inProgress.toLocaleString("fa-IR")}
            </span>
            <span className="text-xs font-bold text-indigo-700">پروژه لایو</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">متخصصان اعزام‌شده با رهگیری زنده موقعیت</p>
        </div>
      </div>

      {/* Control Bar: Search, Category Filter, View Switcher & Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو بر اساس عنوان پروژه، نام متقاضی، شماره تماس، دسته‌بندی یا شهر..."
              value={activeSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-10 pl-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Switcher: Grid vs Table vs Kanban */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setViewMode("GRID")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "GRID"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="نمای کارت‌های تصویری گوگل استیچ"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>کارت‌ها</span>
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "TABLE"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="نمای جدول داده‌ای"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>جدول</span>
              </button>
              <button
                onClick={() => setViewMode("KANBAN")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "KANBAN"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="برد کانبان مراحل"
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>کانبان</span>
              </button>
            </div>

            {/* Create Project Button */}
            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ثبت پروژه</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="همگام‌سازی لحظه‌ای"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Chips: Categories & Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap pl-1">دسته:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "همه دسته‌ها" : cat}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap pl-2 pr-2 border-r border-slate-200">وضعیت:</span>
          {[
            { id: "ALL", label: "همه وضعیت‌ها" },
            { id: "ACTIVE", label: "جدید (Active)" },
            { id: "APPROVED", label: "تایید شده" },
            { id: "IN_PROGRESS", label: "در حال اجرا" },
            { id: "COMPLETED", label: "تکمیل شده" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`rounded-lg px-2.5 py-1 font-bold whitespace-nowrap transition cursor-pointer ${
                selectedStatus === st.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area: Grid, Table, or Kanban */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-xs">
          <RotateCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
          <span className="text-xs font-bold text-slate-500">در حال دریافت و بارگذاری سفارشات و پروژه‌ها...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 shadow-xs text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-800">هیچ پروژه‌ای مطابق فیلترهای انتخابی یافت نشد</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            شما می‌توانید با دکمه «ثبت پروژه» در بالا، سفارش جدیدی را در سامانه ثبت کنید یا فیلترها را ریست نمایید.
          </p>
        </div>
      ) : viewMode === "GRID" ? (
        /* GOOGLE STITCH VISUAL CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const statusInfo = STATUS_CONFIG[proj.status] || STATUS_CONFIG.ACTIVE;
            return (
              <div
                key={proj.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition"
              >
                <div>
                  {/* Card Header: Category Tag & Status Chip */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                      دسته: {proj.category}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.badgeBg}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Title & Code */}
                  <h3
                    onClick={() => setSelectedProject(proj)}
                    className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition cursor-pointer line-clamp-1"
                  >
                    {proj.title}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    شناسه: #{proj.id.slice(-8)}
                  </div>

                  {/* Description snippet if available */}
                  {proj.details && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                      {proj.details}
                    </p>
                  )}

                  {/* Requester User Pill */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                        {proj.user.fullName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-800">{proj.user.fullName}</span>
                          {proj.user.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{proj.user.phone}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Smartphone className="h-2.5 w-2.5" />
                      {proj.user.deviceModel || "Android"}
                    </span>
                  </div>

                  {/* Location & Time */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{proj.city}</span>
                      {proj.address && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          • {proj.address}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(proj.createdAt).toLocaleDateString("fa-IR", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Budget & Actions */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">بودجه امانی مصوب</span>
                    <span className="text-xs font-black text-emerald-700 font-mono flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {proj.budget}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProject(proj)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 transition cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>جزئیات</span>
                    </button>

                    {proj.status === "ACTIVE" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: proj.id, status: "APPROVED" })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>تایید</span>
                      </button>
                    )}

                    {proj.status === "APPROVED" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: proj.id, status: "IN_PROGRESS" })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>اعزام</span>
                      </button>
                    )}

                    {proj.status === "IN_PROGRESS" && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: proj.id, status: "COMPLETED" })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>تسویه</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "TABLE" ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">عنوان پروژه و رده</th>
                  <th className="py-3 px-4">کارفرما / متقاضی</th>
                  <th className="py-3 px-4">بودجه مصوب</th>
                  <th className="py-3 px-4">شهر و نشانی</th>
                  <th className="py-3 px-4">وضعیت سامانه</th>
                  <th className="py-3 px-4">زمان ثبت</th>
                  <th className="py-3 px-4 text-center">عملیات نظارتی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {projects.map((proj) => {
                  const statusInfo = STATUS_CONFIG[proj.status] || STATUS_CONFIG.ACTIVE;
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/70 transition">
                      {/* Title & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold">
                            {proj.category.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{proj.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              دسته: {proj.category} • کد: #{proj.id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Requester User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{proj.user.fullName}</span>
                            {proj.user.isVerified && (
                              <span title="احراز هویت شده">
                                <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>{proj.user.phone}</span>
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Smartphone className="h-2.5 w-2.5" />
                              {proj.user.deviceModel || "Android"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold text-slate-900 font-mono">
                          <span>{proj.budget}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3" />
                          پوشش امانی
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{proj.city}</span>
                        </div>
                        {proj.address && (
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[140px]">
                            {proj.address}
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.badgeBg}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {new Date(proj.createdAt).toLocaleTimeString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(proj.createdAt).toLocaleDateString("fa-IR", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 transition cursor-pointer shadow-2xs"
                            title="مشاهده جزییات کامل و تله‌متری"
                          >
                            <Eye className="h-3 w-3" />
                            <span>جزییات</span>
                          </button>

                          {proj.status === "ACTIVE" && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: proj.id, status: "APPROVED" })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                              title="تایید فوری پروژه"
                            >
                              <Check className="h-3 w-3" />
                              <span>تایید</span>
                            </button>
                          )}

                          {proj.status === "APPROVED" && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: proj.id, status: "IN_PROGRESS" })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                              title="شروع پروژه و اعزام متخصص"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>اعزام</span>
                            </button>
                          )}

                          {proj.status === "IN_PROGRESS" && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: proj.id, status: "COMPLETED" })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                              title="تایید حسن انجام کار و تسویه امانی"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>تسویه</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => (
            <div key={col.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="text-xs font-black text-slate-800">{col.title}</span>
                <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 font-mono">
                  {col.items.length.toLocaleString("fa-IR")}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
                {col.items.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 font-medium">
                    موردی در این ستون نیست
                  </div>
                ) : (
                  col.items.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:border-blue-400 hover:shadow-sm transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs line-clamp-1">{proj.title}</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {proj.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-700">{proj.user.fullName}</span>
                        <span className="font-mono font-bold text-slate-900">{proj.budget}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {proj.city}
                        </span>
                        <span className="font-mono">
                          {new Date(proj.createdAt).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal / Drawer */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedProject.title}</h3>
                  <span className="text-xs text-slate-400">شناسه پروژه: #{selectedProject.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Escrow Guarantee Highlight */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">پوشش حساب امانی کارجور (Escrow Guarantee) فعال است</span>
                <span className="text-[11px] text-emerald-700">
                  بودجه اعلامی ({selectedProject.budget}) تا زمان تایید رضایت متقاضی نزد سامانه محفوظ می‌ماند.
                </span>
              </div>
            </div>

            {/* Requester & Device Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">مشخصات متقاضی</span>
                <span className="font-bold text-slate-900 block">{selectedProject.user.fullName}</span>
                <span className="text-slate-500 font-mono block">{selectedProject.user.phone}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">پلتفرم و دستگاه مبدا</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                  {selectedProject.user.platform} ({selectedProject.user.deviceModel})
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ثبت شده در: {new Date(selectedProject.createdAt).toLocaleString("fa-IR")}
                </span>
              </div>
            </div>

            {/* Description / Additional Details */}
            {selectedProject.details && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">توضیحات تکمیلی متقاضی:</span>
                <p className="text-slate-700 leading-relaxed">{selectedProject.details}</p>
              </div>
            )}

            {/* Actions & Status Changer */}
            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">تغییر وضعیت مستقیم:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedProject.status !== "APPROVED" && (
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedProject.id, status: "APPROVED" })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    تایید پروژه
                  </button>
                )}

                {selectedProject.status !== "IN_PROGRESS" && (
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedProject.id, status: "IN_PROGRESS" })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    اعزام و شروع
                  </button>
                )}

                {selectedProject.status !== "COMPLETED" && (
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedProject.id, status: "COMPLETED" })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    تکمیل و تسویه
                  </button>
                )}

                {selectedProject.status !== "CANCELLED" && (
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedProject.id, status: "CANCELLED" })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                  >
                    لغو / مسدودسازی
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT CREATION MODAL (Google Stitch Creator) */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">ثبت سفارش / پروژه جدید</h3>
                  <span className="text-xs text-slate-400">Google Stitch Project Creator</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateProjectOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProjectMutation.mutate(newProjectForm);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان سفارش / پروژه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نصب پکیج دیواری و رادیاتور"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">دسته‌بندی خدمت *</label>
                  <select
                    value={newProjectForm.category}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                  >
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">بودجه پیشنهادی (تومان) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ۱,۵۰۰,۰۰۰ تومان"
                    value={newProjectForm.budget}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, budget: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نام متقاضی / کارفرما</label>
                  <input
                    type="text"
                    placeholder="نام و نام خانوادگی"
                    value={newProjectForm.requesterName}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, requesterName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">شماره تماس متقاضی</label>
                  <input
                    type="text"
                    placeholder="09120000000"
                    value={newProjectForm.requesterPhone}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, requesterPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شهر</label>
                  <input
                    type="text"
                    placeholder="تهران"
                    value={newProjectForm.city}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نشانی یا محله</label>
                  <input
                    type="text"
                    placeholder="خیابان یا منطقه..."
                    value={newProjectForm.address}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شرح و توضیحات تکمیلی</label>
                <textarea
                  rows={3}
                  placeholder="نیازمندی‌ها، قطعات مورد نیاز یا شرایط پروژه..."
                  value={newProjectForm.details}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, details: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden transition leading-relaxed"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? "در حال ثبت..." : "ثبت و انتشار پروژه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
