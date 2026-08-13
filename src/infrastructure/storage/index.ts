import { IStorageAdapter } from "./storage-adapter.interface";
import { MinIOStorageAdapter } from "./minio-storage.adapter";

export * from "./storage-adapter.interface";
export * from "./minio-storage.adapter";

let storageInstance: IStorageAdapter | null = null;

export function getStorageAdapter(): IStorageAdapter {
  if (!storageInstance) {
    storageInstance = new MinIOStorageAdapter();
  }
  return storageInstance;
}
