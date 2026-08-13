import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/karaan"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().default("karaan_super_secret_jwt_key_2026"),
  SMS_PROVIDER: z.enum(["mock", "kavenegar", "farazsms"]).default("mock"),
  KAVENEGAR_API_KEY: z.string().optional(),
  MAP_PROVIDER: z.enum(["mock", "neshan", "balad"]).default("mock"),
  NESHAN_API_KEY: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "zarinpal"]).default("mock"),
  ZARINPAL_MERCHANT_ID: z.string().optional(),
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadminpassword"),
  S3_BUCKET: z.string().default("karaan-uploads"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
