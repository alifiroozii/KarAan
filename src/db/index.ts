import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "postgres://postgres:postgres@localhost:5432/karaan";

const isRemote =
  connectionString.includes(".com") ||
  connectionString.includes(".tech") ||
  connectionString.includes(".cloud") ||
  connectionString.includes("sslmode=require") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("vercel-storage.com") ||
  connectionString.includes("supabase.co");

export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
  ssl: isRemote ? "require" : undefined,
  prepare: false,
});

export const db = drizzle(client, { schema });
export const sql = client;

