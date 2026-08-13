import { IMapAdapter, LocationPoint } from "./map-adapter.interface";

export class MockMapAdapter implements IMapAdapter {
  /**
   * Haversine formula to compute exact distance in meters between two lat/lng points
   */
  calculateDistanceMeters(
    pointA: LocationPoint,
    pointB: LocationPoint
  ): number {
    const R = 6371000; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (pointB.latitude - pointA.latitude) * rad;
    const dLon = (pointB.longitude - pointA.longitude) * rad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pointA.latitude * rad) *
        Math.cos(pointB.latitude * rad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  async reverseGeocode(point: LocationPoint): Promise<string> {
    return `تهران، موقعیت آزمایشی (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`;
  }

  isWithinGeofence(
    userLocation: LocationPoint,
    targetLocation: LocationPoint,
    radiusMeters: number
  ): boolean {
    const dist = this.calculateDistanceMeters(userLocation, targetLocation);
    return dist <= radiusMeters;
  }
}
