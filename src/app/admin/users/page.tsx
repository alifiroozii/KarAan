import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { AdminUserManagement } from "@/components/admin/admin-user-management";

export default function AdminUsersPage() {
  return (
    <AdminDashboardLayout>
      <AdminUserManagement />
    </AdminDashboardLayout>
  );
}
