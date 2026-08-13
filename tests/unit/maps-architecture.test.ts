import { describe, it, expect } from "vitest";
import { getMapProvider } from "@/lib/maps/factory";
import { MockMapProvider } from "@/lib/maps/providers/mock-provider";
import { NeshanMapProvider } from "@/lib/maps/providers/neshan-provider";

describe("Map Architecture Provider-Agnostic Unit Tests", () => {
  it("should return MockMapProvider by default when MAP_PROVIDER is MOCK", () => {
    delete process.env.MAP_PROVIDER;
    const provider = getMapProvider();
    expect(provider.name).toBe("MOCK");
  });

  it("should return NeshanMapProvider when MAP_PROVIDER is NESHAN", () => {
    process.env.MAP_PROVIDER = "NESHAN";
    const provider = getMapProvider();
    expect(provider.name).toBe("NESHAN");
    delete process.env.MAP_PROVIDER;
  });

  it("should reverse geocode coordinates using MockMapProvider", async () => {
    const mock = new MockMapProvider();
    const result = await mock.reverseGeocode(35.7000, 51.3500);

    expect(result.latitude).toBe(35.7000);
    expect(result.longitude).toBe(51.3500);
    expect(result.formattedAddress).toContain("تهران");
    expect(result.neighborhood).toBe("انقلاب");
  });

  it("should calculate routing distance and duration", async () => {
    const mock = new MockMapProvider();
    const enghelab = { latitude: 35.7000, longitude: 51.3500 };
    const vanak = { latitude: 35.7500, longitude: 51.4000 };

    const route = await mock.calculateRoute(enghelab, vanak);

    expect(route.distanceMeters).toBeGreaterThan(5000);
    expect(route.durationSeconds).toBeGreaterThan(600);
    expect(route.polylinePoints?.length).toBe(3);
  });
});
