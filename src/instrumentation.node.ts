async function bootstrapNoShowScheduler() {
  try {
    const { ensureNoShowScheduler } = await import("@/lib/queue/no-show.queue");
    await ensureNoShowScheduler();
  } catch (error) {
    // A temporary Redis outage must not prevent the web server from booting.
    // The scheduler initialization will retry on the next server instance boot.
    console.error("[No-show Scheduler Bootstrap Error]", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

void bootstrapNoShowScheduler();

export {};
