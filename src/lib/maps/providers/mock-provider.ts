import {
  MapProvider,
  GeocodingProvider,
  ReverseGeocodingProvider,
  RoutingProvider,
  ETAProvider,
  Coordinates,
  GeocodeResult,
  RouteResult,
} from "../types";
import { calculateDistanceKm } from "../distance";

export class MockMapProvider
  implements MapProvider, GeocodingProvider, ReverseGeocodingProvider, RoutingProvider, ETAProvider
{
  name = "MOCK";

  getTileUrl(): string {
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }

  async forwardGeocode(address: string): Promise<GeocodeResult[]> {
    return [
      {
        latitude: 35.7000,
        longitude: 51.3500,
        formattedAddress: `تهران، ${address}`,
        province: "تهران",
        city: "تهران",
        district: "منطقه ۶",
        neighborhood: "میدان انقلاب",
        confidence: 0.95,
      },
    ];
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: "تهران، خیابان انقلاب، خیابان کارگر شمالی، پلاک ۱۲",
      province: "تهران",
      city: "تهران",
      district: "منطقه ۶",
      neighborhood: "انقلاب",
      confidence: 1.0,
    };
  }

  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const distanceKm = calculateDistanceKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    const distanceMeters = Math.round(distanceKm * 1000);
    // Average urban speed ~30 km/h -> 500 meters per minute
    const durationSeconds = Math.round((distanceMeters / 500) * 60);

    return {
      distanceMeters,
      durationSeconds,
      polylinePoints: [
        origin,
        {
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
        },
        destination,
      ],
    };
  }

  async getEstimatedArrival(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    return this.calculateRoute(origin, destination);
  }
}
