"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileSearch, Loader2, Search } from "lucide-react";

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

async function fetchAudit(input: { q: string; entityName: string; action: string; cursor?: string | null }): Promise<AuditPage> {
  const params = new URLSearchParams({ limit: "40" });
  if (input.q.trim()) params.set("q", input.q.trim());
  if (input.entityName.trim()) params.set("entityName", input.entityName.trim());
  if (input.action.trim()) params.set("action", input.action.trim());
  if (input.cursor) params.set("cursor", input.cursor);
  const response = await fetch(`/api/admin/audit?${params.toString()}`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "دریافت Audit Log ناموفق بود.");
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
      <div>
        <div className="flex items-center gap-2"><FileSearch className="h-6 w-6 text-indigo-400" /><h2 className="text-2xl font-black">Audit Log</h2></div>
        <p className="mt-1 text-sm text-slate-400">رویدادهای امنیتی و دامنه‌ای با اطلاعات حساس redacted می‌شوند.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-[1fr_180px_200px]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3"><Search className="h-4 w-4 text-slate-500" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Action، Entity یا ID" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
        <input value={entityName} onChange={(event) => setEntityName(event.target.value)} placeholder="entity_name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs outline-none" />
        <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="action دقیق" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs outline-none" />
      </div>

      {query.isError && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{query.error.message}</div>}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono text-xs font-bold text-indigo-300">{item.action}</p><p className="mt-1 text-[11px] text-slate-500">{item.entityName}:{item.entityId}</p></div>
              <time className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleString("fa-IR")}</time>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400"><span className="rounded-lg bg-slate-950 px-2 py-1">Actor: {item.actorName ?? item.actorId ?? "SYSTEM"}</span>{item.ipAddress && <span className="rounded-lg bg-slate-950 px-2 py-1">IP: {item.ipAddress}</span>}</div>
            <pre dir="ltr" className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-800 bg-slate-950 p-3 text-[10px] leading-5 text-slate-400">{JSON.stringify(item.details, null, 2)}</pre>
          </article>
        ))}
      </div>
      {query.isLoading && <div className="flex items-center gap-2 rounded-2xl border border-slate-800 p-5 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />در حال دریافت رویدادها…</div>}
      {!query.isLoading && items.length === 0 && <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">رویدادی با این فیلتر پیدا نشد.</p>}
      {query.hasNextPage && <div className="text-center"><button onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold disabled:opacity-50">{query.isFetchingNextPage ? "در حال دریافت…" : "رویدادهای قدیمی‌تر"}</button></div>}
    </section>
  );
}
