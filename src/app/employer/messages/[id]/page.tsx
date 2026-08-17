import { MessagingCenter } from "@/components/messaging/messaging-center";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";

export default async function EmployerConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <EmployerDashboardLayout>
      <MessagingCenter initialConversationId={id} />
    </EmployerDashboardLayout>
  );
}
