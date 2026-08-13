import { NextRequest } from "next/server";
import { requireRole } from "@/modules/auth/auth.middleware";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { FinanceService } from "@/modules/finance/finance.service";
import { MatchingService } from "@/modules/matching/matching.service";
import { createSuccessResponse, createErrorResponse } from "@/lib/errors";
import { z } from "zod";
import crypto from "crypto";

const financeService = new FinanceService();
const matchingService = new MatchingService();

const createShiftSchema = z.object({
  title: z.string().min(3, "عنوان شیفت باید حداقل ۳ کاراکتر باشد"),
  description: z.string().optional(),
  locationName: z.string().min(2, "نام مکان الزامی است"),
  latitude: z.number(),
  longitude: z.number(),
  geofenceRadiusMeters: z.number().min(20).max(5000).default(100),
  requiredSkills: z.array(z.string()).default([]),
  hourlyPayRials: z.number().positive("دستمزد ساعتی باید مثبت باشد"),
  totalBudgetRials: z.number().positive("بودجه کل باید مثبت باشد"),
  startTime: z.string(),
  endTime: z.string(),
  idempotencyKey: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    // Server-side authorization check (Rule 17)
    const session = await requireRole(req, ["EMPLOYER", "ADMIN"]);
    const body = await req.json();
    const parsed = createShiftSchema.parse(body);

    const shiftId = `shf_${crypto.randomUUID()}`;
    const hourlyPayBigInt = BigInt(parsed.hourlyPayRials);
    const totalBudgetBigInt = BigInt(parsed.totalBudgetRials);

    // 1. Lock Escrow (Idempotent financial operation)
    await financeService.lockEscrow(
      session.userId,
      shiftId,
      totalBudgetBigInt,
      parsed.idempotencyKey
    );

    // 2. Save shift to DB
    const [newShift] = await db
      .insert(shifts)
      .values({
        id: shiftId,
        employerId: session.userId,
        title: parsed.title,
        description: parsed.description,
        locationName: parsed.locationName,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        geofenceRadiusMeters: parsed.geofenceRadiusMeters,
        requiredSkills: parsed.requiredSkills,
        hourlyPayRials: hourlyPayBigInt,
        totalBudgetRials: totalBudgetBigInt,
        startAt: new Date(parsed.startTime),
        endAt: new Date(parsed.endTime),
        status: "PUBLISHED",
      })
      .returning();

    // 3. Dispatch spatial matching alerts
    await matchingService.dispatchOffersForShift(newShift.id);

    return createSuccessResponse(
      {
        shiftId: newShift.id,
        status: newShift.status,
        message: "شیفت با موفقیت ایجاد و منتشر شد.",
      },
      201
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(_req: NextRequest) {
  try {
    const shiftList = await db.select().from(shifts).limit(50);
    // Convert BigInts for JSON serialization
    const serialized = shiftList.map((s) => ({
      ...s,
      hourlyPayRials: s.hourlyPayRials.toString(),
      totalBudgetRials: s.totalBudgetRials.toString(),
    }));

    return createSuccessResponse(serialized);
  } catch (error) {
    return createErrorResponse(error);
  }
}
