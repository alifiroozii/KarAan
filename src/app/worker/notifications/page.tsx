"use client";

import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default function WorkerNotificationsPage() {
  return (
    <WorkerMobileLayout>
      <NotificationCenter />
    </WorkerMobileLayout>
  );
}
