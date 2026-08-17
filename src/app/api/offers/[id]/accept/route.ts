import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { ShiftOfferService } from "@/modules/matching/shift-offer.service";
import { ReliabilityService } from "@/modules/reliability/reliability.service";
import { AppError, createErrorResponse, createSuccessResponse } from "@/lib/errors";

const offerService = new ShiftOfferService();
const reliabilityService = new ReliabilityService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission(req, "shift.accept");
    const { id } = await params;

    // Old/pending Offers cannot bypass a sanction that became active after
    // the Offer was generated.
    await reliabilityService.assertWorkerCanTakeShifts(session.userId);
    const result = await offerService.acceptOfferAtomic(id, session.userId);

    if (!result.success) {
      throw new AppError(result.message, "CONFLICT", 409);
    }

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
