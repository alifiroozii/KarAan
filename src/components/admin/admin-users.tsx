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
        <h2 className="text-2xl font-black">مدیریت کاربران</h2>
        <p className="mt-1 text-sm text-slate-400">جست‌وجو، فیلتر و مسدودسازی امن همراه با ثبت Audit و لغو Session.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-[1fr_180px_160px]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="نام، موبایل یا ایمیل" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </label>
        <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs outline-none">
          {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={blocked} onChange={(event) => setBlocked(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs outline-none">
          <option value="">همه وضعیت‌ها</option>
          <option value="false">فعال</option>
          <option value="true">مسدود</option>
        </select>
      </div>

      {query.isError && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{query.error.message}</div>}
      {statusMutation.isError && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{statusMutation.error.message}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-right text-xs">
            <thead className="bg-slate-900 text-slate-400"><tr><th className="p-4">کاربر</th><th className="p-4">نقش</th><th className="p-4">احراز</th><th className="p-4">امنیت</th><th className="p-4">وضعیت</th><th className="p-4">عملیات</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/70">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-300"><UserRound className="h-4 w-4" /></div><div><p className="font-bold text-white">{user.fullName}</p><p className="mt-1 text-[10px] text-slate-500">{user.phone}{user.email ? ` · ${user.email}` : ""}</p></div></div></td>
                  <td className="p-4 font-mono text-[10px] text-slate-300">{user.role}</td>
                  <td className="p-4">{user.isVerified ? <span className="text-emerald-300">تأیید</span> : <span className="text-amber-300">تأییدنشده</span>}</td>
                  <td className="p-4">{user.twoFactorEnabled ? <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />2FA</span> : <span className="text-slate-500">بدون 2FA</span>}</td>
                  <td className="p-4">{user.isBlocked ? <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">مسدود</span> : <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">فعال</span>}</td>
                  <td className="p-4"><button onClick={() => { setActionTarget(user); setReason(""); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 font-bold ${user.isBlocked ? "border-emerald-500/30 text-emerald-300" : "border-red-500/30 text-red-300"}`}>{user.isBlocked ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}{user.isBlocked ? "رفع مسدودی" : "مسدود"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {query.isLoading && <div className="flex items-center gap-2 p-5 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />در حال دریافت کاربران…</div>}
        {!query.isLoading && users.length === 0 && <p className="p-6 text-center text-sm text-slate-500">کاربری با این فیلتر پیدا نشد.</p>}
        {query.hasNextPage && <div className="border-t border-slate-800 p-3 text-center"><button onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold disabled:opacity-50">{query.isFetchingNextPage ? "در حال دریافت…" : "نمایش بیشتر"}</button></div>}
      </div>

      {actionTarget && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-sm font-black">{actionTarget.isBlocked ? "رفع مسدودی" : "مسدود کردن"} — {actionTarget.fullName}</p>
          <p className="mt-1 text-xs leading-6 text-slate-400">در حالت مسدودسازی، همه Sessionهای فعال کاربر در همان Transaction لغو می‌شوند.</p>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="دلیل عملیات (حداقل ۵ کاراکتر)" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-indigo-500" />
          <div className="mt-3 flex gap-2"><button disabled={reason.trim().length < 5 || statusMutation.isPending} onClick={() => statusMutation.mutate({ user: actionTarget, reasonText: reason.trim() })} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{statusMutation.isPending ? "در حال ثبت…" : "تأیید عملیات"}</button><button onClick={() => { setActionTarget(null); setReason(""); }} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold">انصراف</button></div>
        </div>
      )}
    </section>
  );
}
