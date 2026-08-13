import { Coordinates } from "../maps/types";

/**
 * Mask exact worker coordinates to an approximate location (~1 km precision)
 * for privacy protection before assignment.
 */
export function maskExactLocationToApproximate(coord: Coordinates): Coordinates {
  // Rounding coordinates to 2 decimal places masks exact position to ~1.1 km precision grid
  const approximateLat = Math.round(coord.latitude * 100) / 100;
  const approximateLng = Math.round(coord.longitude * 100) / 100;

  return {
    latitude: approximateLat,
    longitude: approximateLng,
  };
}

/**
 * Check if location update exceeds significance threshold to prevent DB bloat.
 * Min distance change: 20 meters, or max age: 60 seconds.
 */
export function isSignificantLocationChange(
  lastLat: number | null,
  lastLng: number | null,
  lastTimestamp: number | null,
  newLat: number,
  newLng: number,
  newTimestamp: number = Date.now(),
  minDistanceMeters = 20,
  maxAgeSeconds = 60
): boolean {
  if (!lastLat || !lastLng || !lastTimestamp) return true;

  const ageSeconds = (newTimestamp - lastTimestamp) / 1000;
  if (ageSeconds >= maxAgeSeconds) return true;

  // Approximate distance calculation in meters
  const dLat = (newLat - lastLat) * 111000;
  const dLng = (newLng - lastLng) * 111000 * Math.cos((lastLat * Math.PI) / 180);
  const distanceMeters = Math.sqrt(dLat * dLat + dLng * dLng);

  return distanceMeters >= minDistanceMeters;
}
