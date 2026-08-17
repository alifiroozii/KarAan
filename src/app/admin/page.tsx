import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { AdminOverview } from "@/components/admin/admin-overview";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardLayout>
      <AdminOverview />
    </AdminDashboardLayout>
  );
}
