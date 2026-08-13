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
import { MockMapProvider } from "./mock-provider";

export class NeshanMapProvider
  implements MapProvider, GeocodingProvider, ReverseGeocodingProvider, RoutingProvider, ETAProvider
{
  name = "NESHAN";
  private apiKey: string;
  private fallbackMock: MockMapProvider;

  constructor(apiKey = process.env.MAP_API_KEY || "") {
    this.apiKey = apiKey;
    this.fallbackMock = new MockMapProvider();
  }

  getTileUrl(): string {
    return "https://api.neshan.org/v2/static";
  }

  async forwardGeocode(address: string): Promise<GeocodeResult[]> {
    if (!this.apiKey) return this.fallbackMock.forwardGeocode(address);
    try {
      const res = await fetch(
        `https://api.neshan.org/v4/geocoding?address=${encodeURIComponent(address)}`,
        { headers: { "Api-Key": this.apiKey } }
      );
      if (!res.ok) return this.fallbackMock.forwardGeocode(address);
      const data = await res.json();
      return (data.location ? [data.location] : []).map((loc: { x: number; y: number }) => ({
        latitude: loc.y,
        longitude: loc.x,
        formattedAddress: address,
      }));
    } catch {
      return this.fallbackMock.forwardGeocode(address);
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    if (!this.apiKey) return this.fallbackMock.reverseGeocode(lat, lng);
    try {
      const res = await fetch(
        `https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`,
        { headers: { "Api-Key": this.apiKey } }
      );
      if (!res.ok) return this.fallbackMock.reverseGeocode(lat, lng);
      const data = await res.json();
      return {
        latitude: lat,
        longitude: lng,
        formattedAddress: data.formatted_address || "آدرس یافت شد",
        province: data.state,
        city: data.city,
        neighborhood: data.neighbourhood,
      };
    } catch {
      return this.fallbackMock.reverseGeocode(lat, lng);
    }
  }

  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    return this.fallbackMock.calculateRoute(origin, destination);
  }

  async getEstimatedArrival(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    return this.fallbackMock.getEstimatedArrival(origin, destination);
  }
}
