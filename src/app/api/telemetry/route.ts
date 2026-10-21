import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/system";
import { userRegistry } from "@/lib/user-registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "MOBILE_ACTIVITY";
    const entityName = body.entityName || "mobile_app";
    const entityId = body.entityId || body.phone || body.userId || "anonymous_device";
    const actorName = body.actorName || body.fullName || (body.phone ? `کاربر ${body.phone}` : "کاربر اپلیکیشن");
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "android-client";

    const details = {
      ...(body.details || {}),
      phone: body.phone,
      role: body.role,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed,
      deviceModel: body.deviceModel,
      appVersion: body.appVersion,
      actorName,
      timestamp: new Date().toISOString(),
    };

    // 1. Persist to Postgres database audit_logs table
    try {
      await db.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID().slice(0, 16)}`,
        actorId: body.userId || null,
        entityName,
        entityId,
        action,
        details,
        ipAddress,
        timestamp: new Date(),
      });
    } catch (dbErr) {
      // In case Postgres is sleeping, log error but proceed with cloud memory store
      console.warn("DB audit insert fallback:", dbErr);
    }

    // 2. If coordinates are provided, update user in memory registry
    if (body.phone) {
      try {
        const found = await userRegistry.findUser({ phone: body.phone });
        if (found) {
          found.lastLoginAt = new Date().toISOString();
          if (body.lat && body.lng) {
            found.notes = `موقعیت: ${body.lat.toFixed(4)}, ${body.lng.toFixed(4)} | سرعت: ${body.speed || 0}`;
          }
        }
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      logged: true,
      action,
      timestamp: details.timestamp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطا در ثبت رویداد تله‌متری";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "online",
    service: "KarAan Mobile Real-Time Telemetry & Audit Service",
    timestamp: new Date().toISOString(),
  });
}
