import { MessagingCenter } from "@/components/messaging/messaging-center";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";

export default async function WorkerConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <WorkerMobileLayout>
      <MessagingCenter initialConversationId={id} />
    </WorkerMobileLayout>
  );
}
