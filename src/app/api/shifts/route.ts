import { NextRequest } from "next/server";
import { eq, inArray, or } from "drizzle-orm";
import { requirePermission, requireRole } from "@/modules/auth/auth.middleware";
import { db } from "@/db";
import { branches, shifts } from "@/db/schema";
import { EscrowService } from "@/modules/settlement/escrow.service";
import { MatchingService } from "@/modules/matching/matching.service";
import { createSuccessResponse, createErrorResponse, AppError } from "@/lib/errors";
import { z } from "zod";

const escrowService = new EscrowService();
const matchingService = new MatchingService();

const moneySchema = z
  .union([
    z.string().regex(/^\d+$/, "مبلغ باید عدد صحیح ریالی باشد"),
    z.number().int().safe().positive("مبلغ باید عدد صحیح مثبت باشد"),
  ])
  .transform((value) => BigInt(value))
  .refine((value) => value > 0n, "مبلغ باید بیشتر از صفر باشد");

const createShiftSchema = z.object({
  title: z.string().min(3, "عنوان شیفت باید حداقل ۳ کاراکتر باشد"),
  description: z.string().optional(),
  locationName: z.string().min(2, "نام مکان الزامی است"),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  geofenceRadiusMeters: z.number().int().min(20).max(5000).default(100),
  requiredSkills: z.array(z.string()).default([]),
  hourlyPayRials: moneySchema,
  totalBudgetRials: moneySchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(req, ["EMPLOYER", "ADMIN"]);
    const body = await req.json();
    const parsed = createShiftSchema.parse(body);
    const headerKey = req.headers.get("Idempotency-Key")?.trim();
    const idempotencyKey = headerKey || parsed.idempotencyKey;
    if (!idempotencyKey) {
      throw new AppError("Idempotency-Key برای ساخت شیفت الزامی است.", "VALIDATION_ERROR", 422);
    }

    const result = await escrowService.createPublishedShiftWithEscrow({
      employerUserId: session.userId,
      idempotencyKey,
      title: parsed.title,
      description: parsed.description,
      locationName: parsed.locationName,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      geofenceRadiusMeters: parsed.geofenceRadiusMeters,
      requiredSkills: parsed.requiredSkills,
      hourlyPayRials: parsed.hourlyPayRials,
      totalBudgetRials: parsed.totalBudgetRials,
      startAt: new Date(parsed.startTime),
      endAt: new Date(parsed.endTime),
    });

    let matchingDispatched = false;
    if (result.created) {
      try {
        await matchingService.dispatchOffersForShift(result.shiftId);
        matchingDispatched = true;
      } catch {
        matchingDispatched = false;
      }
    }

    return createSuccessResponse(
      {
        shiftId: result.shiftId,
        status: result.status,
        escrow: result.escrow,
        idempotent: !result.created,
        matchingDispatched,
        message: result.created
          ? "شیفت با سپرده مالی امن ایجاد و منتشر شد."
          : "این درخواست قبلاً با همین Idempotency-Key ثبت شده است.",
      },
      result.created ? 201 : 200
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "shift.view");
    let shiftList;

    if (session.role === "EMPLOYER") {
      shiftList = await db.select().from(shifts).where(eq(shifts.employerId, session.userId)).limit(50);
    } else if (session.role === "WORKER") {
      shiftList = await db
        .select()
        .from(shifts)
        .where(or(eq(shifts.status, "PUBLISHED"), eq(shifts.status, "MATCHING"), eq(shifts.status, "PARTIALLY_FILLED")))
        .limit(50);
    } else if (session.role === "BRANCH_MANAGER") {
      const managed = await db.select({ id: branches.id }).from(branches).where(eq(branches.managerUserId, session.userId));
      const ids = managed.map((item) => item.id);
      shiftList = ids.length ? await db.select().from(shifts).where(inArray(shifts.branchId, ids)).limit(50) : [];
    } else {
      shiftList = await db.select().from(shifts).limit(50);
    }

    const serialized = shiftList.map((shift) => ({
      ...shift,
      hourlyPayRials: shift.hourlyPayRials.toString(),
      totalBudgetRials: shift.totalBudgetRials.toString(),
    }));
    return createSuccessResponse(serialized);
  } catch (error) {
    return createErrorResponse(error);
  }
}
