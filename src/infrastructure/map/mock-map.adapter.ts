import { EstimatedArrival, IMapAdapter, LocationPoint } from "./map-adapter.interface";

export class MockMapAdapter implements IMapAdapter {
  calculateDistanceMeters(
    pointA: LocationPoint,
    pointB: LocationPoint
  ): number {
    const R = 6371000;
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
    return this.calculateDistanceMeters(userLocation, targetLocation) <= radiusMeters;
  }

  async getEstimatedArrival(
    origin: LocationPoint,
    destination: LocationPoint
  ): Promise<EstimatedArrival> {
    const distanceMeters = this.calculateDistanceMeters(origin, destination);
    // Stable deterministic development estimate: ~30 km/h plus a 2 minute urban overhead.
    const durationSeconds = Math.max(60, Math.round(distanceMeters / (30_000 / 3600)) + 120);
    return { distanceMeters, durationSeconds };
  }
}
