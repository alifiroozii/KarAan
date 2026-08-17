import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, businesses, employerProfiles } from "@/db/schema";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "branch.read");
    const baseQuery = db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        phone: branches.phone,
        managerUserId: branches.managerUserId,
        businessId: businesses.id,
        businessName: businesses.name,
      })
      .from(branches)
      .innerJoin(businesses, eq(branches.businessId, businesses.id))
      .innerJoin(employerProfiles, eq(businesses.employerProfileId, employerProfiles.id));

    const rows = session.role === "EMPLOYER"
      ? await baseQuery.where(eq(employerProfiles.userId, session.userId))
      : session.role === "BRANCH_MANAGER"
        ? await baseQuery.where(eq(branches.managerUserId, session.userId))
        : await baseQuery;

    return createSuccessResponse(rows);
  } catch (error) {
    return createErrorResponse(error);
  }
}
