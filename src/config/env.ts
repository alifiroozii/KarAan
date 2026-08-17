import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgrespassword@localhost:5432/karaan"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AUTH_SECRET: z.string().default("karaan_super_secret_jwt_key_2026"),

  // SMS Adapter
  SMS_PROVIDER: z.enum(["mock", "kavenegar", "farazsms"]).default("mock"),
  SMS_API_KEY: z.string().optional(),

  // Payment Adapter
  PAYMENT_PROVIDER: z.enum(["mock", "zarinpal"]).default("mock"),
  PAYMENT_API_KEY: z.string().optional(),
  PAYMENT_CALLBACK_URL: z
    .string()
    .default("http://localhost:3000/api/payments/callback"),
  ZARINPAL_MERCHANT_ID: z.string().optional(),
  ZARINPAL_SANDBOX: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  // Map Adapter
  MAP_PROVIDER: z.enum(["mock", "neshan", "balad"]).default("mock"),
  MAP_API_KEY: z.string().optional(),

  // Storage / MinIO
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_BUCKET: z.string().default("karaan-uploads"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadminpassword"),

  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
