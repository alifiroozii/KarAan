import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { WalletDashboard } from "@/components/wallet/wallet-dashboard";
import { PayoutRequestCard } from "@/components/wallet/payout-request-card";

export default function WorkerWalletPage() {
  return (
    <WorkerMobileLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-black">کیف پول من</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مانده، درآمد شیفت‌ها و درخواست‌های برداشت ثبت‌شده در Ledger کارآن.
          </p>
        </div>
        <WalletDashboard />
        <PayoutRequestCard />
      </div>
    </WorkerMobileLayout>
  );
}
