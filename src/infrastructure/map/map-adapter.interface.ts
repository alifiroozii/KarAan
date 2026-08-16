export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface EstimatedArrival {
  distanceMeters: number;
  durationSeconds: number;
}

export interface IMapAdapter {
  calculateDistanceMeters(
    pointA: LocationPoint,
    pointB: LocationPoint
  ): number;
  reverseGeocode(point: LocationPoint): Promise<string>;
  isWithinGeofence(
    userLocation: LocationPoint,
    targetLocation: LocationPoint,
    radiusMeters: number
  ): boolean;
  getEstimatedArrival(
    origin: LocationPoint,
    destination: LocationPoint
  ): Promise<EstimatedArrival>;
}
