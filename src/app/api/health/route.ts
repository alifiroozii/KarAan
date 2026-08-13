import { NextResponse } from "next/server";
import { redis } from "@/infrastructure/redis/redis-client";

export async function GET() {
  let redisHealthy = false;

  try {
    if (redis.status !== "ready") await redis.connect();
    const ping = await redis.ping();
    redisHealthy = ping === "PONG";
  } catch {
    redisHealthy = false;
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: "healthy",
        redis: redisHealthy ? "healthy" : "unhealthy",
      },
    },
    { status: 200 }
  );
}
