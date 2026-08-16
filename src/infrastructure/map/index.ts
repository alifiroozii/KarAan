import { MockMapAdapter } from "./mock-map.adapter";
import { NeshanMapAdapter } from "./neshan-map.adapter";
import type { IMapAdapter } from "./map-adapter.interface";

let adapter: IMapAdapter | null = null;

export function getMapAdapter(): IMapAdapter {
  if (adapter) return adapter;

  const provider = (process.env.MAP_PROVIDER || "mock").toLowerCase();
  adapter = provider === "neshan" ? new NeshanMapAdapter() : new MockMapAdapter();
  return adapter;
}

export type { IMapAdapter, LocationPoint, EstimatedArrival } from "./map-adapter.interface";
export { MockMapAdapter } from "./mock-map.adapter";
export { NeshanMapAdapter } from "./neshan-map.adapter";
