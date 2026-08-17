"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, RefreshCw, Send } from "lucide-react";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";

interface ConversationItem {
  id: string;
  assignmentId: string;
  assignmentState: string;
  shiftId: string;
  shiftTitle: string;
  workerName: string;
  counterpartLabel: string;
  canSend: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isMine: boolean;
  readAt: string | null;
  createdAt: string;
}

interface MessagePage {
  conversation: {
    id: string;
    assignmentId: string;
    shiftTitle: string;
    workerName: string;
    canSend: boolean;
  };
  items: MessageItem[];
  nextCursor: string | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "خطا در ارتباط با سرور");
  }
  return body.data as T;
}

async function fetchConversations() {
  return readJson<{ items: ConversationItem[] }>(
    await fetch("/api/conversations", { cache: "no-store" })
  );
}

async function fetchMessagePage(conversationId: string, cursor: string | null) {
  const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin);
  url.searchParams.set("limit", "40");
  if (cursor) url.searchParams.set("cursor", cursor);
  return readJson<MessagePage>(await fetch(url.toString(), { cache: "no-store" }));
}

export function MessagingCenter({ initialConversationId }: { initialConversationId?: string }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [draft, setDraft] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 60_000,
  });
  const conversations = conversationsQuery.data?.items ?? [];
  const selectedConversation = conversations.find((item) => item.id === selectedId) ?? null;
  useRealtimeRoom("assignment", selectedConversation?.assignmentId);

  const messagesQuery = useInfiniteQuery({
    queryKey: ["messages", selectedId],
    queryFn: ({ pageParam }) => fetchMessagePage(selectedId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(selectedId),
  });

  const visibleMessages = useMemo(
    () => messagesQuery.data?.pages.slice().reverse().flatMap((page) => page.items) ?? [],
    [messagesQuery.data]
  );
  const activeConversation = messagesQuery.data?.pages[0]?.conversation;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void fetch(`/api/conversations/${selectedId}/read`, { method: "POST" }).then(() => {
      if (!cancelled) void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    return () => {
      cancelled = true;
    };
  }, [queryClient, selectedId]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) =>
      readJson<MessageItem>(
        await fetch(`/api/conversations/${selectedId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({ content }),
        })
      ),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["messages", selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  function handleSelect(id: string) {
    setSelectedId(id);
    setDraft("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sendMutation.isPending || !activeConversation?.canSend) return;
    sendMutation.mutate(content);
  }

  return (
    <section dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-black">گفتگوها</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">گفتگوی عملیاتی امن برای Assignmentهای واقعی</p>
        </div>
        <button
          type="button"
          onClick={() => void conversationsQuery.refetch()}
          disabled={conversationsQuery.isFetching}
          className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
          aria-label="بازخوانی گفتگوها"
        >
          <RefreshCw className={`h-4 w-4 ${conversationsQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {conversationsQuery.isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {conversationsQuery.error.message}
        </div>
      )}

      <div className="grid min-h-[540px] overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-muted/20 md:border-b-0 md:border-l">
          <div className="max-h-[540px] overflow-y-auto p-2">
            {conversationsQuery.isLoading && (
              <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> در حال دریافت گفتگوها…
              </div>
            )}
            {!conversationsQuery.isLoading && conversations.length === 0 && (
              <p className="p-4 text-xs leading-6 text-muted-foreground">
                هنوز گفتگویی ایجاد نشده است. از صفحه شیفت فعال یا لیست نیروهای شیفت، گزینه «گفتگو» را انتخاب کنید.
              </p>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => handleSelect(conversation.id)}
                className={`mb-1 w-full rounded-2xl p-3 text-right transition ${
                  selectedId === conversation.id ? "bg-indigo-600 text-white" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold">{conversation.counterpartLabel}</p>
                    <p className={`mt-1 truncate text-[11px] ${selectedId === conversation.id ? "text-indigo-100" : "text-muted-foreground"}`}>
                      {conversation.shiftTitle}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="min-w-5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                      {conversation.unreadCount.toLocaleString("fa-IR")}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-h-[540px] flex-col">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              یک گفتگو را برای مشاهده پیام‌ها انتخاب کنید.
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <p className="text-sm font-extrabold">{activeConversation?.shiftTitle ?? selectedConversation?.shiftTitle ?? "گفتگو"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Assignment: {(activeConversation?.assignmentId ?? selectedConversation?.assignmentId ?? "").slice(-10)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {messagesQuery.hasNextPage && (
                  <div className="mb-4 text-center">
                    <button
                      type="button"
                      onClick={() => void messagesQuery.fetchNextPage()}
                      disabled={messagesQuery.isFetchingNextPage}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
                    >
                      {messagesQuery.isFetchingNextPage ? "در حال دریافت…" : "پیام‌های قدیمی‌تر"}
                    </button>
                  </div>
                )}
                {messagesQuery.isLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> در حال دریافت پیام‌ها…
                  </div>
                )}
                {messagesQuery.isError && (
                  <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{messagesQuery.error.message}</div>
                )}
                <div className="space-y-2">
                  {visibleMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.isMine ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.isMine ? "bg-indigo-600 text-white" : "bg-muted text-foreground"}`}>
                        {!message.isMine && <p className="mb-1 text-[10px] font-bold opacity-70">{message.senderName}</p>}
                        <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
                        <div className="mt-1 flex items-center justify-end gap-2 text-[9px] opacity-65">
                          <span>{new Date(message.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" })}</span>
                          {message.isMine && <span>{message.readAt ? "خوانده شد" : "ارسال شد"}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="border-t border-border p-3">
                {activeConversation && !activeConversation.canSend && (
                  <p className="mb-2 rounded-xl bg-amber-500/10 p-2 text-[11px] text-amber-300">
                    این گفتگو فقط خواندنی است؛ پنجره ارسال پیام برای Assignment پایان یافته است.
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                    rows={2}
                    disabled={!activeConversation?.canSend || sendMutation.isPending}
                    placeholder="پیام خود را بنویسید…"
                    className="min-h-12 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || !activeConversation?.canSend || sendMutation.isPending}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
                    aria-label="ارسال پیام"
                  >
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                {sendMutation.error && <p className="mt-2 text-xs text-red-300">{sendMutation.error.message}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
