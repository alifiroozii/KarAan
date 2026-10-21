import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { AdminMainView } from "@/components/admin/admin-main-view";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardLayout>
      <AdminMainView />
    </AdminDashboardLayout>
  );
}
