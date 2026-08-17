"use client";

import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default function EmployerNotificationsPage() {
  return (
    <EmployerDashboardLayout>
      <NotificationCenter />
    </EmployerDashboardLayout>
  );
}
