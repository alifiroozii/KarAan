export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  province?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  confidence?: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polylinePoints?: Coordinates[];
}

export interface MapProviderConfig {
  apiKey?: string;
  providerName: "NESHAN" | "MAP_IR" | "MOCK";
}

export interface MapProvider {
  name: string;
  getTileUrl?(): string;
}

export interface GeocodingProvider {
  forwardGeocode(address: string): Promise<GeocodeResult[]>;
}

export interface ReverseGeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<GeocodeResult>;
}

export interface RoutingProvider {
  calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult>;
}

export interface ETAProvider {
  getEstimatedArrival(origin: Coordinates, destination: Coordinates): Promise<RouteResult>;
}
