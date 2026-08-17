import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { AdminAuditLog } from "@/components/admin/admin-audit-log";

export default function AdminAuditPage() {
  return (
    <AdminDashboardLayout>
      <AdminAuditLog />
    </AdminDashboardLayout>
  );
}
