import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 40 distributed realtime architecture guards", () => {
  it("publishes every local realtime envelope to the shared Redis bus", () => {
    const socketServer = source("src/lib/realtime/socket-server.ts");
    expect(socketServer).toContain("publishDistributedRealtimeEvent");
    expect(socketServer).toContain("void publishDistributedRealtimeEvent(envelope)");
  });

  it("uses versioned Redis Pub/Sub envelopes with instance identity", () => {
    const bus = source("src/lib/realtime/distributed-bus.ts");
    expect(bus).toContain('REALTIME_REDIS_CHANNEL = "karaan:realtime:v1"');
    expect(bus).toContain("sourceInstanceId");
    expect(bus).toContain("REALTIME_INSTANCE_ID");
    expect(bus).toContain("redis.publish");
  });

  it("keeps Redis delivery best-effort after durable domain writes", () => {
    const bus = source("src/lib/realtime/distributed-bus.ts");
    expect(bus).toContain("[Distributed Realtime Publish Error]");
    expect(bus).toContain("return 0");
  });

  it("subscribes long-lived Socket.IO runtimes and suppresses self echoes", () => {
    const server = source("server.mjs");
    expect(server).toContain("realtimeSubscriber.subscribe(REALTIME_REDIS_CHANNEL)");
    expect(server).toContain("envelope.sourceInstanceId === realtimeInstanceId");
    expect(server).toContain("io.to(envelope.room).emit(envelope.event, envelope.payload)");
  });

  it("validates Redis envelope shape before remote socket emission", () => {
    const server = source("server.mjs");
    expect(server).toContain("isValidDistributedEnvelope");
    expect(server).toContain("user|worker|assignment|shift|business|branch");
    expect(server).toContain("Number.isFinite(value.publishedAt)");
  });

  it("fails production realtime startup on missing Redis but allows development degradation", () => {
    const server = source("server.mjs");
    expect(server).toContain("if (dev)");
    expect(server).toContain("await startRealtimeSubscriber()");
    expect(server).toContain("Redis subscriber unavailable in development");
  });

  it("closes the Redis subscriber during graceful shutdown", () => {
    const server = source("server.mjs");
    expect(server).toContain("await realtimeSubscriber.quit()");
  });
});
