import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { PaymentTopupForm } from "@/components/payments/payment-topup-form";

export default function EmployerNewPaymentPage() {
  return (
    <EmployerDashboardLayout>
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-xl font-black">شارژ حساب کارآن</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ایجاد درخواست پرداخت امن و انتقال به درگاه.
          </p>
        </div>
        <PaymentTopupForm />
      </div>
    </EmployerDashboardLayout>
  );
}
