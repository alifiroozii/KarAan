import { describe, expect, it } from "vitest";
import { MockMapAdapter } from "./mock-map.adapter";

describe("MockMapAdapter ETA", () => {
  it("returns positive distance and duration for different points", async () => {
    const adapter = new MockMapAdapter();
    const eta = await adapter.getEstimatedArrival(
      { latitude: 35.7219, longitude: 51.3347 },
      { latitude: 35.7325, longitude: 51.4221 }
    );

    expect(eta.distanceMeters).toBeGreaterThan(0);
    expect(eta.durationSeconds).toBeGreaterThan(0);
  });

  it("never returns less than one minute", async () => {
    const adapter = new MockMapAdapter();
    const eta = await adapter.getEstimatedArrival(
      { latitude: 35.7219, longitude: 51.3347 },
      { latitude: 35.7219, longitude: 51.3347 }
    );

    expect(eta.durationSeconds).toBeGreaterThanOrEqual(60);
  });
});
