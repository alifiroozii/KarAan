import { describe, it, expect } from "vitest";
import { MockMapAdapter } from "@/infrastructure/map";

describe("Spatial Matching Geofence Math", () => {
  const mapAdapter = new MockMapAdapter();

  it("should calculate exact distance between Azadi Square and Enghelab Square in Tehran (~4.2km)", () => {
    const azadi = { latitude: 35.6997, longitude: 51.3380 };
    const enghelab = { latitude: 35.7010, longitude: 51.3912 };

    const distanceMeters = mapAdapter.calculateDistanceMeters(azadi, enghelab);
    // Distance is around 4800 meters
    expect(distanceMeters).toBeGreaterThan(4000);
    expect(distanceMeters).toBeLessThan(5500);
  });

  it("should correctly evaluate geofence radius", () => {
    const shiftLocation = { latitude: 35.7000, longitude: 51.3500 };
    const workerNearby = { latitude: 35.7003, longitude: 51.3505 }; // ~50m away
    const workerFar = { latitude: 35.7100, longitude: 51.3700 }; // >1.5km away

    expect(mapAdapter.isWithinGeofence(workerNearby, shiftLocation, 100)).toBe(true);
    expect(mapAdapter.isWithinGeofence(workerFar, shiftLocation, 100)).toBe(false);
  });
});
