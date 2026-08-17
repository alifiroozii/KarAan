import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { WalletDashboard } from "@/components/wallet/wallet-dashboard";

export default function EmployerWalletPage() {
  return (
    <EmployerDashboardLayout>
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-xl font-black">کیف پول و گردش حساب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            موجودی از Wallet Ledger محاسبه و هر شارژ تاییدشده فقط یک‌بار ثبت می‌شود.
          </p>
        </div>
        <WalletDashboard showTopup />
      </div>
    </EmployerDashboardLayout>
  );
}
