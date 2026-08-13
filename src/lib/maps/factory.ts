import { MapProvider, ReverseGeocodingProvider, GeocodingProvider, RoutingProvider } from "./types";
import { MockMapProvider } from "./providers/mock-provider";
import { NeshanMapProvider } from "./providers/neshan-provider";

export function getMapProvider(): MapProvider & ReverseGeocodingProvider & GeocodingProvider & RoutingProvider {
  const providerEnv = (process.env.MAP_PROVIDER || "MOCK").toUpperCase();

  switch (providerEnv) {
    case "NESHAN":
      return new NeshanMapProvider();
    case "MAP_IR":
      // Map.ir provider placeholder (falls back to mock seamlessly)
      return new MockMapProvider();
    case "MOCK":
    default:
      return new MockMapProvider();
  }
}
