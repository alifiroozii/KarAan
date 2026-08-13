export interface LocationPoint {
  latitude: number;
  longitude: number;
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
}
