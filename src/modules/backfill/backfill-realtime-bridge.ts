import { realtimeServer } from "@/lib/realtime/socket-server";
import { BackfillCancellationService } from "./backfill-cancellation.service";

const globalState = globalThis as typeof globalThis & {
  __karaanBackfillOverrideBridgeBound?: boolean;
};

export function bindBackfillOverrideBridge() {
  if (globalState.__karaanBackfillOverrideBridgeBound) return;
  globalState.__karaanBackfillOverrideBridgeBound = true;
  const service = new BackfillCancellationService();

  realtimeServer.subscribe((envelope) => {
    if (envelope.event !== "no_show.overridden") return;
    const payload = envelope.payload as { assignmentId?: string };
    if (!payload.assignmentId) return;

    void service
      .cancelForSourceAssignment(
        payload.assignmentId,
        "SOURCE_NO_SHOW_OVERRIDDEN"
      )
      .catch((error) => {
        console.error("[Backfill Override Cancellation Error]", {
          assignmentId: payload.assignmentId,
          message: error instanceof Error ? error.message : "unknown",
        });
      });
  });
}
