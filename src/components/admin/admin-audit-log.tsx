"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShieldCheck, Loader2, Search, Filter, Clock, Globe, User, Terminal } from "lucide-react";

interface AuditItem {
  id: string;
  actorId: string | null;
  actorName: string | null;
  entityName: string;
  entityId: string;
  action: string;
  details: unknown;
  ipAddress: string | null;
  timestamp: string;
}

interface AuditPage {
  items: AuditItem[];
  nextCursor: string | null;
}

async function fetchAudit(input: {
  q: string;
  entityName: string;
  action: string;
  cursor?: string | null;
}): Promise<AuditPage> {
  const params = new URLSearchParams({ limit: "40" });
  if (input.q.trim()) params.set("q", input.q.trim());
  if (input.entityName.trim()) params.set("entityName", input.entityName.trim());
  if (input.action.trim()) params.set("action", input.action.trim());
  if (input.cursor) params.set("cursor", input.cursor);
  const response = await fetch(`/api/admin/audit?${params.toString()}`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "دریافت گزارش‌های ممیزی ناموفق بود.");
  }
  return body.data as AuditPage;
}

export function AdminAuditLog() {
  const [q, setQ] = useState("");
  const [entityName, setEntityName] = useState("");
  const [action, setAction] = useState("");

  const query = useInfiniteQuery({
    queryKey: ["admin", "audit", q, entityName, action],
    queryFn: ({ pageParam }) => fetchAudit({ q, entityName, action, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  return (
    <section className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              رویدادهای امنیتی و ممیزی سامانه (Google Stitch Audit Log)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت و پایش تمام تراکنش‌ها، تغییر وضعیت پروژه‌ها، رویدادهای دسترسی و احراز هویت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Terminal className="h-3.5 w-3.5" />
            تله‌متری امن TLS
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-[1fr_200px_200px]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus-within:border-blue-500 focus-within:bg-white transition">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="جستجو در اکشن، موجودیت یا شناسه کاربر..."
            className="w-full bg-transparent outline-none placeholder-slate-400"
          />
        </label>

        <input
          value={entityName}
          onChange={(event) => setEntityName(event.target.value)}
          placeholder="فیلتر موجودیت (Entity Name)"
          className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition placeholder-slate-400"
        />

        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="فیلتر دقیق اقدام (Action)"
          className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition placeholder-slate-400"
        />
      </div>

      {/* Error state */}
      {query.isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
          خطا در بارگذاری لاگ‌ها: {query.error.message}
        </div>
      )}

      {/* Audit Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 font-mono text-xs font-bold text-blue-700">
                    {item.action}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {item.entityName}: <span className="font-mono text-slate-500">#{item.entityId.slice(-8)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <time>{new Date(item.timestamp).toLocaleString("fa-IR")}</time>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                <User className="h-3 w-3 text-slate-400" />
                کارگزار: {item.actorName ?? item.actorId ?? "سیستم خودکار"}
              </span>

              {item.ipAddress && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-mono text-slate-600">
                  <Globe className="h-3 w-3 text-slate-400" />
                  IP: {item.ipAddress}
                </span>
              )}
            </div>

            {Boolean(item.details) && (
              <div className="mt-3">
                <pre
                  dir="ltr"
                  className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-mono leading-relaxed text-slate-700"
                >
                  {JSON.stringify(item.details, null, 2)}
                </pre>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Loading state */}
      {query.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-xs font-bold text-slate-500 shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>در حال دریافت لاگ‌های امنیتی سامانه...</span>
        </div>
      )}

      {/* Empty state */}
      {!query.isLoading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500 shadow-xs">
          هیچ رویداد امنیتی یا لاگ ممیزی با فیلترهای مشخص‌شده یافت نشد.
        </div>
      )}

      {/* Pagination button */}
      {query.hasNextPage && (
        <div className="text-center pt-2">
          <button
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-700 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {query.isFetchingNextPage ? "در حال دریافت..." : "مشاهده رویدادهای قدیمی‌تر"}
          </button>
        </div>
      )}
    </section>
  );
}
