import { describe, expect, it } from "vitest";
import { evaluateArrivalEvidence } from "./arrival-policy";

describe("arrival evidence policy", () => {
  it("accepts an accurate location inside geofence", () => {
    expect(
      evaluateArrivalEvidence({
        accuracyMeters: 12,
        maxAccuracyMeters: 80,
        distanceMeters: 35,
        geofenceRadiusMeters: 100,
      })
    ).toEqual({ accepted: true });
  });

  it("rejects low GPS accuracy even when coordinates are inside geofence", () => {
    expect(
      evaluateArrivalEvidence({
        accuracyMeters: 140,
        maxAccuracyMeters: 80,
        distanceMeters: 25,
        geofenceRadiusMeters: 100,
      })
    ).toEqual({ accepted: false, reason: "LOW_LOCATION_ACCURACY" });
  });

  it("rejects accurate coordinates outside geofence", () => {
    expect(
      evaluateArrivalEvidence({
        accuracyMeters: 10,
        maxAccuracyMeters: 80,
        distanceMeters: 180,
        geofenceRadiusMeters: 100,
      })
    ).toEqual({ accepted: false, reason: "OUTSIDE_GEOFENCE" });
  });
});
