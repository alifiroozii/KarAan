import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { JobRequest } from "@prisma/client";

const createSchema = z.object({ title: z.string().min(2), category: z.string().min(1), description: z.string().optional(), latitude: z.number(), longitude: z.number(), address: z.string().optional(), budget: z.coerce.bigint().optional(), isUrgent: z.boolean().optional() });

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as "OPEN" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
  const jobs = await prisma.jobRequest.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(jobs.map((job: JobRequest) => ({ ...job, budget: job.budget?.toString() })));
}

export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات درخواست معتبر نیست." }, { status: 400 });
  const requesterId = request.headers.get("x-user-id");
  if (!requesterId) return NextResponse.json({ error: "ورود الزامی است." }, { status: 401 });
  const job = await prisma.jobRequest.create({ data: { ...parsed.data, requesterId, budget: parsed.data.budget } });
  return NextResponse.json({ ...job, budget: job.budget?.toString() }, { status: 201 });
}
