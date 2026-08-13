export interface IStorageAdapter {
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucket?: string
  ): Promise<string>;
  getPresignedUrl(fileName: string, bucket?: string): Promise<string>;
}
