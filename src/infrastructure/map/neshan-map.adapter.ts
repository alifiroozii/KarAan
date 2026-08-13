import { IMapAdapter, LocationPoint } from "./map-adapter.interface";
import { MockMapAdapter } from "./mock-map.adapter";

export class NeshanMapAdapter implements IMapAdapter {
  private apiKey: string;
  private fallback: MockMapAdapter;

  constructor(apiKey = process.env.NESHAN_API_KEY || "") {
    this.apiKey = apiKey;
    this.fallback = new MockMapAdapter();
  }

  calculateDistanceMeters(
    pointA: LocationPoint,
    pointB: LocationPoint
  ): number {
    return this.fallback.calculateDistanceMeters(pointA, pointB);
  }

  async reverseGeocode(point: LocationPoint): Promise<string> {
    if (!this.apiKey) return this.fallback.reverseGeocode(point);

    try {
      const res = await fetch(
        `https://api.neshan.org/v2/reverse?lat=${point.latitude}&lng=${point.longitude}`,
        {
          headers: {
            "Api-Key": this.apiKey,
          },
        }
      );
      const data = await res.json();
      return data?.formatted_address || (await this.fallback.reverseGeocode(point));
    } catch (err) {
      console.error("[Neshan Reverse Geocode Error]", err);
      return this.fallback.reverseGeocode(point);
    }
  }

  isWithinGeofence(
    userLocation: LocationPoint,
    targetLocation: LocationPoint,
    radiusMeters: number
  ): boolean {
    return this.fallback.isWithinGeofence(userLocation, targetLocation, radiusMeters);
  }
}
