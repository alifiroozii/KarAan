"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  LockKeyhole,
  Plus,
  WalletCards,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/domain-displays";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { cn } from "@/lib/utils";

interface WalletSummaryResponse {
  walletId: string;
  userId: string;
  availableRials: string;
  lockedEscrowRials: string;
  currency: "RIAL";
  updatedAt: string;
  sourceOfTruth: "WALLET_LEDGER";
}

interface WalletTransactionResponse {
  transactionId: string;
  amountRials: string;
  direction: "CREDIT" | "DEBIT";
  referenceType:
    | "ESCROW_LOCK"
    | "SETTLEMENT"
    | "REFUND"
    | "TOPUP"
    | "WITHDRAWAL"
    | "PENALTY";
  referenceId: string | null;
  description: string;
  balanceAfterRials: string;
  createdAt: string;
}

interface WalletTransactionsPage {
  items: WalletTransactionResponse[];
  nextCursor: string | null;
}

async function getApiData<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "دریافت اطلاعات کیف پول ناموفق بود.");
  }
  return body.data as T;
}

function formatTransactionDate(value: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function referenceLabel(type: WalletTransactionResponse["referenceType"]): string {
  const labels: Record<WalletTransactionResponse["referenceType"], string> = {
    TOPUP: "شارژ کیف پول",
    ESCROW_LOCK: "قفل سپرده",
    SETTLEMENT: "تسویه شیفت",
    REFUND: "بازگشت وجه",
    WITHDRAWAL: "برداشت",
    PENALTY: "جریمه",
  };
  return labels[type];
}

export function WalletDashboard({ showTopup = false }: { showTopup?: boolean }) {
  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getApiData<WalletSummaryResponse>("/api/wallet"),
  });

  const transactionsQuery = useInfiniteQuery({
    queryKey: ["wallet", "transactions"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "25" });
      if (pageParam) params.set("cursor", pageParam);
      return getApiData<WalletTransactionsPage>(`/api/wallet/transactions?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  useRealtimeRoom("user", walletQuery.data?.userId);

  if (walletQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-3xl border border-border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (walletQuery.isError || !walletQuery.data) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        {walletQuery.error?.message ?? "کیف پول در دسترس نیست."}
      </div>
    );
  }

  const wallet = walletQuery.data;
  const transactions = transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <WalletCards className="h-4 w-4" /> کیف پول کارآن
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              <CurrencyDisplay amountRials={BigInt(wallet.availableRials)} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">موجودی قابل استفاده</div>
          </div>

          {showTopup && (
            <Link href="/employer/payments/new" className={cn(buttonVariants(), "shrink-0")}>
              <Plus className="h-4 w-4" /> افزایش موجودی
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <WalletCards className="h-4 w-4" /> موجودی آزاد
            </div>
            <div className="mt-2 font-extrabold">
              <CurrencyDisplay amountRials={BigInt(wallet.availableRials)} />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="h-4 w-4" /> سپرده قفل‌شده
            </div>
            <div className="mt-2 font-extrabold">
              <CurrencyDisplay amountRials={BigInt(wallet.lockedEscrowRials)} />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              مدیریت Escrow در Prompt 32 فعال می‌شود.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="mb-5">
          <h2 className="text-lg font-black">گردش حساب</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            هر تغییر موجودی یک Ledger Entry مستقل و غیرتکراری دارد.
          </p>
        </div>

        {transactionsQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : transactionsQuery.isError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
            {transactionsQuery.error.message}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            هنوز تراکنشی برای این کیف پول ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {transactions.map((transaction) => {
              const isCredit = transaction.direction === "CREDIT";
              const DirectionIcon = isCredit ? ArrowDownLeft : ArrowUpRight;
              return (
                <div
                  key={transaction.transactionId}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/50">
                      <DirectionIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{transaction.description}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {referenceLabel(transaction.referenceType)} · {formatTransactionDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-left">
                    <div className="text-sm font-extrabold" dir="ltr">
                      {isCredit ? "+" : "-"}
                      <span dir="rtl" className="mr-1 inline-block">
                        <CurrencyDisplay amountRials={BigInt(transaction.amountRials)} />
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      مانده: <CurrencyDisplay amountRials={BigInt(transaction.balanceAfterRials)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {transactionsQuery.hasNextPage && (
          <button
            type="button"
            onClick={() => void transactionsQuery.fetchNextPage()}
            disabled={transactionsQuery.isFetchingNextPage}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full")}
          >
            {transactionsQuery.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
            نمایش تراکنش‌های بیشتر
          </button>
        )}
      </section>
    </div>
  );
}
