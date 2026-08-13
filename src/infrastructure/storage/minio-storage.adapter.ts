import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageAdapter } from "./storage-adapter.interface";

export class MinIOStorageAdapter implements IStorageAdapter {
  private s3Client: S3Client;
  private defaultBucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
    const region = process.env.S3_REGION || "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY || "minioadmin";
    const secretAccessKey = process.env.S3_SECRET_KEY || "minioadmin";

    this.defaultBucket = process.env.S3_BUCKET || "karaan-uploads";
    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucket = this.defaultBucket
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      });
      await this.s3Client.send(command);
      return `${process.env.S3_PUBLIC_URL || "http://localhost:9000"}/${bucket}/${fileName}`;
    } catch (err) {
      console.error("[MinIO Upload Error]", err);
      return `/uploads/${fileName}`;
    }
  }

  async getPresignedUrl(
    fileName: string,
    bucket = this.defaultBucket
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: fileName,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (err) {
      console.error("[MinIO Presigned URL Error]", err);
      return `/uploads/${fileName}`;
    }
  }
}
