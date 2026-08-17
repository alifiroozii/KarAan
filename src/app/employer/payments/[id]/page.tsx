"use client";

import { use } from "react";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { PaymentStatusCard } from "@/components/payments/payment-status-card";

export default function EmployerPaymentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <EmployerDashboardLayout>
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-xl font-black">وضعیت پرداخت</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            وضعیت تایید درگاه و شماره مرجع پرداخت را اینجا می‌بینید.
          </p>
        </div>
        <PaymentStatusCard paymentId={id} />
      </div>
    </EmployerDashboardLayout>
  );
}
