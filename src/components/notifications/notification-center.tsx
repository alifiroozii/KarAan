"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck, Loader2, MessageSquareText, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

interface Preferences {
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppAlwaysEnabled: true;
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "عملیات اعلان ناموفق بود.");
  }
  return body.data as T;
}

function timeLabel(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      readResult<NotificationPage>(
        await fetch("/api/notifications?limit=50", { cache: "no-store" })
      ),
  });
  const preferencesQuery = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () =>
      readResult<Preferences>(
        await fetch("/api/notifications/preferences", { cache: "no-store" })
      ),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markRead = useMutation({
    mutationFn: async (id: string) =>
      readResult<NotificationItem>(
        await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      ),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: async () =>
      readResult<{ updatedCount: number }>(
        await fetch("/api/notifications/read-all", { method: "POST" })
      ),
    onSuccess: invalidate,
  });
  const updatePreferences = useMutation({
    mutationFn: async (next: { smsEnabled: boolean; pushEnabled: boolean }) =>
      readResult<Preferences>(
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        })
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications", "preferences"], data);
    },
  });

  const preferences = preferencesQuery.data;
  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
              <BellRing className="h-5 w-5" /> مرکز اعلان‌ها
            </div>
            <h1 className="mt-1 text-xl font-black">پیام‌ها و یادآوری‌های کارآن</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              اعلان داخل برنامه همیشه ثبت می‌شود؛ SMS و Push بر اساس تنظیمات شما ارسال می‌شوند.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {markAllRead.isPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="ml-2 h-4 w-4" />
            )}
            خواندن همه
          </Button>
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-background/50 p-3 text-xs text-muted-foreground">
          {unreadCount.toLocaleString("fa-IR")} اعلان خوانده‌نشده
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Smartphone className="h-4 w-4 text-indigo-400" /> تنظیم کانال‌ها
        </h2>
        {preferencesQuery.isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> در حال دریافت تنظیمات...
          </div>
        ) : preferences ? (
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center justify-between rounded-2xl border border-border p-3">
              <span>
                <strong className="block">SMS</strong>
                <span className="text-xs text-muted-foreground">یادآوری‌های مهم روی شماره موبایل</span>
              </span>
              <input
                type="checkbox"
                checked={preferences.smsEnabled}
                disabled={updatePreferences.isPending}
                onChange={(event) =>
                  updatePreferences.mutate({
                    smsEnabled: event.target.checked,
                    pushEnabled: preferences.pushEnabled,
                  })
                }
                className="h-4 w-4 accent-indigo-600"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-border p-3">
              <span>
                <strong className="block">Push</strong>
                <span className="text-xs text-muted-foreground">
                  زیرساخت آماده است؛ تا اتصال Provider واقعی، ارسال Push به‌عنوان موفق ثبت نمی‌شود.
                </span>
              </span>
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                disabled={updatePreferences.isPending}
                onChange={(event) =>
                  updatePreferences.mutate({
                    smsEnabled: preferences.smsEnabled,
                    pushEnabled: event.target.checked,
                  })
                }
                className="h-4 w-4 accent-indigo-600"
              />
            </label>
          </div>
        ) : (
          <p className="mt-4 text-xs text-red-300">دریافت تنظیمات اعلان ناموفق بود.</p>
        )}
      </section>

      <section className="space-y-3">
        {notificationsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-3xl border border-border bg-card p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> در حال دریافت اعلان‌ها...
          </div>
        ) : notificationsQuery.isError ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
            {notificationsQuery.error.message}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-3 h-7 w-7" /> هنوز اعلانی ندارید.
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => !item.isRead && markRead.mutate(item.id)}
              className={`w-full rounded-3xl border p-4 text-right transition-colors ${
                item.isRead
                  ? "border-border bg-card"
                  : "border-indigo-500/35 bg-indigo-500/10 hover:bg-indigo-500/15"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="mt-0.5 rounded-xl bg-background p-2">
                    <MessageSquareText className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">{item.body}</p>
                  </div>
                </div>
                {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />}
              </div>
              <div className="mt-3 flex justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{item.type}</span>
                <span>{timeLabel(item.createdAt)}</span>
              </div>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
