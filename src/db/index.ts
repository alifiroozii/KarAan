import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/karaan";

// Disable prefetch for serverless / Next.js API routes compat
const client = postgres(connectionString, { max: 10, idle_timeout: 20 });

export const db = drizzle(client, { schema });
