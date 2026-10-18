import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function GET() {
  let dbStatus = "unconfigured";
  let dbError: string | null = null;
  const configuredEnv = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );

  try {
    const res = await sql`SELECT 1 as alive;`;
    if (res && res.length > 0) {
      dbStatus = "connected";
    }
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        configuredEnv,
        error: dbError,
      },
      services: {
        api: "healthy",
      },
    },
    { status: 200 }
  );
}
