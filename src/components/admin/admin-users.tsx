"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Ban, Loader2, RotateCcw, Search, ShieldCheck, UserRound } from "lucide-react";

type UserRole =
  | "WORKER"
  | "EMPLOYER"
  | "BRANCH_MANAGER"
  | "SHIFT_SUPERVISOR"
  | "SUPPORT_AGENT"
  | "DISPUTE_AGENT"
  | "FINANCE_ADMIN"
  | "ADMIN"
  | "SUPER_ADMIN";

interface UserItem {
  id: string;
  phone: string;
  email: string | null;
  role: UserRole;
  fullName: string;
  isVerified: boolean;
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

interface UserPage {
  items: UserItem[];
  nextCursor: string | null;
}

const roles: Array<{ value: "" | UserRole; label: string }> = [
  { value: "", label: "همه نقش‌ها" },
  { value: "WORKER", label: "کارجو" },
  { value: "EMPLOYER", label: "کارفرما" },
  { value: "BRANCH_MANAGER", label: "مدیر شعبه" },
  { value: "SHIFT_SUPERVISOR", label: "سرپرست شیفت" },
  { value: "SUPPORT_AGENT", label: "پشتیبانی" },
  { value: "DISPUTE_AGENT", label: "حل اختلاف" },
  { value: "FINANCE_ADMIN", label: "مالی" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

async function fetchUsers(input: { q: string; role: string; blocked: string; cursor?: string | null }): Promise<UserPage> {
  const params = new URLSearchParams({ limit: "30" });
  if (input.q.trim()) params.set("q", input.q.trim());
  if (input.role) params.set("role", input.role);
  if (input.blocked) params.set("blocked", input.blocked);
  if (input.cursor) params.set("cursor", input.cursor);
  const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "دریافت کاربران ناموفق بود.");
  return body.data as UserPage;
}

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [blocked, setBlocked] = useState("");
  const [actionTarget, setActionTarget] = useState<UserItem | null>(null);
  const [reason, setReason] = useState("");

  const query = useInfiniteQuery({
    queryKey: ["admin", "users", q, role, blocked],
    queryFn: ({ pageParam }) => fetchUsers({ q, role, blocked, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const users = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const statusMutation = useMutation({
    mutationFn: async ({ user, reasonText }: { user: UserItem; reasonText: string }) => {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: !user.isBlocked, reason: reasonText }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "تغییر وضعیت کاربر ناموفق بود.");
      return body.data as { user: UserItem };
    },
    onSuccess: () => {
      setActionTarget(null);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-900">مدیریت کاربران سامانه</h2>
        <p className="mt-1 text-xs text-slate-500">
          جست‌وجو، فیلتر و مسدودسازی امن همراه با ثبت Audit و لغو Session همگام با اپلیکیشن موبایل.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_160px] shadow-xs">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-900 focus-within:border-indigo-500">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="جست‌وجوی نام، موبایل یا جیمیل…"
            className="w-full bg-transparent py-2.5 text-xs sm:text-sm outline-none placeholder-slate-400"
          />
        </label>

        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
        >
          {roles.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={blocked}
          onChange={(event) => setBlocked(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="false">فعال</option>
          <option value="true">مسدود</option>
        </select>
      </div>

      {query.isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-50 p-4 text-xs font-bold text-red-600">
          {query.error.message}
        </div>
      )}
      {statusMutation.isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-50 p-4 text-xs font-bold text-red-600">
          {statusMutation.error.message}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-4 font-semibold">کاربر / مشخصات</th>
                <th className="p-4 font-semibold">نقش در سامانه</th>
                <th className="p-4 font-semibold">حساب جیمیل / موبایل</th>
                <th className="p-4 font-semibold">پلتفرم ورودی</th>
                <th className="p-4 font-semibold">وضعیت حساب</th>
                <th className="p-4 font-semibold">عملیات مدیریت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isWorker = user.role === "WORKER";
                const isEmployer = user.role === "EMPLOYER";
                const hasGmail = user.email && user.email.includes("@");

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          {user.fullName ? user.fullName[0] : "ک"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{user.fullName}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400 font-mono">ID: {user.id.slice(0, 12)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {isWorker && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          متخصص و کارجو
                        </span>
                      )}
                      {isEmployer && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          درخواست‌کننده (کارفرما)
                        </span>
                      )}
                      {!isWorker && !isEmployer && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                          مدیر سامانه
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        {hasGmail ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800">
                            <span className="rounded bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold">
                              Gmail
                            </span>
                            <span>{user.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">بدون ایمیل</span>
                        )}
                        <p className="text-[10px] text-slate-500 font-mono">{user.phone}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                        {user.phone.startsWith("0999") || user.fullName.includes("اندروید") ? "📱 اپ موبایل" : "💻 وب / موبایل"}
                      </span>
                    </td>

                    <td className="p-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                          مسدود شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          فعال
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => {
                          setActionTarget(user);
                          setReason("");
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          user.isBlocked
                            ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-red-500/30 bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {user.isBlocked ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        <span>{user.isBlocked ? "رفع مسدودی" : "مسدودسازی"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {query.isLoading && (
          <div className="flex items-center gap-2 p-5 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت کاربران…
          </div>
        )}
        {!query.isLoading && users.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">کاربری با این فیلتر پیدا نشد.</p>
        )}
        {query.hasNextPage && (
          <div className="border-t border-slate-200 p-3 text-center">
            <button
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {query.isFetchingNextPage ? "در حال دریافت…" : "نمایش بیشتر"}
            </button>
          </div>
        )}
      </div>

      {/* Block/Unblock Action Modal */}
      {actionTarget && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-sm font-black text-slate-900">
            {actionTarget.isBlocked ? "رفع مسدودی" : "مسدود کردن"} — {actionTarget.fullName}
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-600">
            در حالت مسدودسازی، همه Sessionهای فعال کاربر در همان Transaction لغو می‌شوند.
          </p>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="دلیل عملیات (حداقل ۵ کاراکتر)"
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={reason.trim().length < 5 || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ user: actionTarget, reasonText: reason.trim() })}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              {statusMutation.isPending ? "در حال ثبت…" : "تأیید عملیات"}
            </button>
            <button
              onClick={() => {
                setActionTarget(null);
                setReason("");
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
