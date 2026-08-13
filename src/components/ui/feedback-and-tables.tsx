import React from "react";
import { AlertCircle, Inbox, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "./button";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3 flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center">
        <Inbox className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-6 bg-rose-950/40 border border-rose-500/30 rounded-3xl text-center space-y-3 flex flex-col items-center">
      <AlertCircle className="w-8 h-8 text-rose-400" />
      <p className="text-xs font-semibold text-rose-300">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تلاش مجدد</span>
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-800/80 ${className}`} />;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronRight className="w-4 h-4" />
        <span>صفحه قبل</span>
      </Button>
      <span className="text-xs text-slate-400">
        صفحه {currentPage} از {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>صفحه بعد</span>
        <ChevronLeft className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function DataTableShell({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
      <table className="w-full text-right text-xs">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80 text-slate-200">{children}</tbody>
      </table>
    </div>
  );
}
