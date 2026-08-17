import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { AdminUsers } from "@/components/admin/admin-users";

export default function AdminUsersPage() {
  return (
    <AdminDashboardLayout>
      <AdminUsers />
    </AdminDashboardLayout>
  );
}
