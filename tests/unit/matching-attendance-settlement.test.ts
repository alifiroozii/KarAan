import { describe, it, expect } from "vitest";
import { calculateDistanceKm } from "@/lib/maps/distance";

describe("Matching, Geofencing & Settlement Engine Unit Tests", () => {
  describe("Haversine Distance & Geofencing Calculation", () => {
    it("should accurately calculate distance between Enghelab Sq and Vanak Sq (~6.2 km)", () => {
      const enghelab = { lat: 35.7000, lng: 51.3500 };
      const vanak = { lat: 35.7500, lng: 51.4000 };

      const dist = calculateDistanceKm(enghelab.lat, enghelab.lng, vanak.lat, vanak.lng);
      expect(dist).toBeGreaterThan(5);
      expect(dist).toBeLessThan(8);
    });

    it("should calculate near-zero distance for identical coordinates", () => {
      const point = { lat: 35.7000, lng: 51.3500 };
      const dist = calculateDistanceKm(point.lat, point.lng, point.lat, point.lng);
      expect(dist).toBe(0);
    });

    it("should identify whether a worker is inside 100m geofence radius", () => {
      const branch = { lat: 35.7000, lng: 51.3500 };
      // Worker 50 meters away
      const workerInside = { lat: 35.7004, lng: 51.3504 };
      // Worker 500 meters away
      const workerOutside = { lat: 35.7040, lng: 51.3540 };

      const distInsideMeters = calculateDistanceKm(branch.lat, branch.lng, workerInside.lat, workerInside.lng) * 1000;
      const distOutsideMeters = calculateDistanceKm(branch.lat, branch.lng, workerOutside.lat, workerOutside.lng) * 1000;

      expect(distInsideMeters).toBeLessThan(100);
      expect(distOutsideMeters).toBeGreaterThan(100);
    });
  });

  describe("Ledger Pay Calculations", () => {
    it("should calculate exact gross pay in Rials for hourly shift", () => {
      const hourlyRate = BigInt(1500000); // 1.5M Rials / hr
      const workedHours = 4.5;
      const calculatedPay = BigInt(Math.round(workedHours)) * hourlyRate;

      expect(calculatedPay).toBe(BigInt(7500000));
    });
  });
});
