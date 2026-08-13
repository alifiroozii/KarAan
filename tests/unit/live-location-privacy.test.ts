import { describe, it, expect } from "vitest";
import { maskExactLocationToApproximate, isSignificantLocationChange } from "@/lib/location/privacy";

describe("Live Location & Privacy Protection Unit Tests", () => {
  describe("Location Privacy Masking", () => {
    it("should mask exact coordinates to 2 decimal places (~1.1km grid)", () => {
      const exactCoord = { latitude: 35.701234, longitude: 51.359876 };
      const masked = maskExactLocationToApproximate(exactCoord);

      expect(masked.latitude).toBe(35.7);
      expect(masked.longitude).toBe(51.36);
      expect(masked.latitude).not.toBe(exactCoord.latitude);
    });
  });

  describe("Adaptive Threshold Distance Filtering", () => {
    it("should reject tiny position changes below min distance threshold (<20m)", () => {
      const now = Date.now();
      // Moving only 2 meters in 5 seconds
      const isSignificant = isSignificantLocationChange(
        35.7000,
        51.3500,
        now - 5000,
        35.70001,
        51.35001,
        now,
        20, // minDistanceMeters
        60  // maxAgeSeconds
      );

      expect(isSignificant).toBe(false);
    });

    it("should accept position changes exceeding min distance threshold (>20m)", () => {
      const now = Date.now();
      // Moving ~100 meters
      const isSignificant = isSignificantLocationChange(
        35.7000,
        51.3500,
        now - 5000,
        35.7009,
        51.3509,
        now,
        20,
        60
      );

      expect(isSignificant).toBe(true);
    });

    it("should force update if max age threshold is exceeded (>60s) even with zero movement", () => {
      const now = Date.now();
      const isSignificant = isSignificantLocationChange(
        35.7000,
        51.3500,
        now - 65000, // 65 seconds ago
        35.7000,
        51.3500,
        now,
        20,
        60
      );

      expect(isSignificant).toBe(true);
    });
  });
});
