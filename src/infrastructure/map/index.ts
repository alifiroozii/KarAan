import { IMapAdapter } from "./map-adapter.interface";
import { MockMapAdapter } from "./mock-map.adapter";
import { NeshanMapAdapter } from "./neshan-map.adapter";

export * from "./map-adapter.interface";
export * from "./mock-map.adapter";
export * from "./neshan-map.adapter";

const mockInstance = new MockMapAdapter();

export function getMapAdapter(): IMapAdapter {
  if (process.env.MAP_PROVIDER === "neshan" && process.env.NESHAN_API_KEY) {
    return new NeshanMapAdapter();
  }
  return mockInstance;
}
