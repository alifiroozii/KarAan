import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { WorkerPresenceService } from "@/lib/redis/presence";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { ReliabilityService } from "@/modules/reliability/reliability.service";

const updateAvailabilitySchema = z.object({
  status: z.enum(["OFFLINE", "AVAILABLE", "BUSY", "WORKING"]),
  maxDistanceKm: z.number().default(15),
  minPayRials: z.string().default("1500000"),
  availableUntil: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const presenceService = new WorkerPresenceService();
const reliabilityService = new ReliabilityService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "worker.availability.update");
    const presence = await presenceService.getWorkerPresence(session.userId);
    return createSuccessResponse(presence);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission(req, "worker.availability.update");
    const parsed = updateAvailabilitySchema.parse(await req.json());

    // Going OFFLINE is always allowed. Any state that makes the Worker eligible
    // for work must respect active Reliability sanctions on the server.
    if (parsed.status === "OFFLINE") {
      await presenceService.setWorkerOffline(session.userId);
      return createSuccessResponse({ status: "OFFLINE" });
    }

    await reliabilityService.assertWorkerCanTakeShifts(session.userId);
    const presence = await presenceService.setWorkerAvailable({
      workerId: session.userId,
      status: parsed.status,
      maxDistanceKm: parsed.maxDistanceKm,
      minPayRials: parsed.minPayRials,
      availableUntil: parsed.availableUntil,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    });

    return createSuccessResponse(presence);
  } catch (error) {
    return createErrorResponse(error);
  }
}
