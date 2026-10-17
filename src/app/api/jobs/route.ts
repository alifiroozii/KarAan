import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { jobRequests, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import crypto from "node:crypto";

const createSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  budget: z.coerce.bigint().optional(),
  isUrgent: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const statusParam = request.nextUrl.searchParams.get("status") as
      | "OPEN"
      | "ACCEPTED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED"
      | null;

    let query = db
      .select({
        id: jobRequests.id,
        requesterId: jobRequests.requesterId,
        title: jobRequests.title,
        category: jobRequests.category,
        description: jobRequests.description,
        latitude: jobRequests.latitude,
        longitude: jobRequests.longitude,
        address: jobRequests.address,
        budget: jobRequests.budget,
        isUrgent: jobRequests.isUrgent,
        status: jobRequests.status,
        createdAt: jobRequests.createdAt,
        updatedAt: jobRequests.updatedAt,
      })
      .from(jobRequests)
      .orderBy(desc(jobRequests.createdAt))
      .limit(100);

    const jobs = statusParam
      ? await query.where(eq(jobRequests.status, statusParam))
      : await query;

    return NextResponse.json(
      jobs.map((job) => ({
        ...job,
        budget: job.budget?.toString() ?? null,
      }))
    );
  } catch (error) {
    console.error("Failed to list jobs:", error);
    return NextResponse.json({ error: "خطا در دریافت لیست کارها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات درخواست معتبر نیست." }, { status: 400 });
    }

    const requesterId = request.headers.get("x-user-id") || "guest_requester";
    const id = `job_${crypto.randomUUID()}`;

    // Ensure requester exists or use system guest
    const [inserted] = await db
      .insert(jobRequests)
      .values({
        id,
        requesterId,
        title: parsed.data.title,
        category: parsed.data.category,
        description: parsed.data.description,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        address: parsed.data.address,
        budget: parsed.data.budget,
        isUrgent: parsed.data.isUrgent ?? false,
        status: "OPEN",
      })
      .returning();

    return NextResponse.json(
      { ...inserted, budget: inserted.budget?.toString() ?? null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json({ error: "خطا در ثبت کار" }, { status: 500 });
  }
}
