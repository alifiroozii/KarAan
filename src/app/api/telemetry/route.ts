import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/system";
import { userRegistry } from "@/lib/user-registry";

const telemetrySchema = z.object({
  action: z.string().max(100).default("MOBILE_ACTIVITY"),
  entityName: z.string().max(100).optional(),
  entityId: z.string().max(200).optional(),
  actorName: z.string().max(200).optional(),
  fullName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  role: z.string().max(50).optional(),
  userId: z.string().max(100).optional().nullable(),
  platform: z.string().max(50).optional(),
  deviceModel: z.string().max(200).optional(),
  appVersion: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  speed: z.number().nonnegative().optional().nullable(),
  details: z.record(z.any()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ success: false, error: "ورودی نامعتبر است." }, { status: 400 });
    }

    const parseResult = telemetrySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "اعتبارسنجی داده‌ها ناموفق بود.", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const body = parseResult.data;
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

    // 1. Record in userRegistry telemetry logs & ensure user exists in directory
    await userRegistry.recordTelemetryLog({
      userId: body.userId || null,
      actorName,
      phone: body.phone,
      role: body.role,
      action,
      entityName,
      entityId,
      details,
      ipAddress,
    });

    if (body.phone) {
      try {
        await userRegistry.registerOrLoginPhone({
          phone: body.phone,
          fullName: body.fullName || body.actorName,
          role: body.role === "PROVIDER" ? "WORKER" : "EMPLOYER",
          platform: (body.platform as any) || "ANDROID",
          deviceModel: body.deviceModel,
          appVersion: body.appVersion,
          ipAddress,
          city: body.city || "تهران",
          notes: body.lat && body.lng ? `مختصات زنده: ${body.lat.toFixed(4)}, ${body.lng.toFixed(4)}` : undefined,
        });
      } catch (regErr) {
        console.warn("User registry auto-register fallback:", regErr);
      }
    }

    // 2. Persist to Postgres database audit_logs table
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
