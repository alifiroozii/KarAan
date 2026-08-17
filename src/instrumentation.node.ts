async function bootstrapBackgroundWorkers() {
  try {
    const [
      { ensureNoShowScheduler },
      { ensureBackfillInfrastructure },
      { bindBackfillOverrideBridge },
    ] = await Promise.all([
      import("@/lib/queue/no-show.queue"),
      import("@/lib/queue/backfill.queue"),
      import("@/modules/backfill/backfill-realtime-bridge"),
    ]);
    bindBackfillOverrideBridge();
    await Promise.all([ensureNoShowScheduler(), ensureBackfillInfrastructure()]);
  } catch (error) {
    // A temporary Redis outage must not prevent the web server from booting.
    // Background work remains retryable/idempotent on the next process boot.
    console.error("[Background Worker Bootstrap Error]", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

void bootstrapBackgroundWorkers();

export {};
