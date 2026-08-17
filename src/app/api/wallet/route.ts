import { NextRequest } from "next/server";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { WalletLedgerService } from "@/modules/wallet/wallet-ledger.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";

const walletLedger = new WalletLedgerService();

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "payment.view");
    const wallet = await walletLedger.getWalletSummary(session.userId);
    return createSuccessResponse({
      walletId: wallet.walletId,
      userId: wallet.userId,
      availableRials: wallet.availableRials.toString(),
      lockedEscrowRials: wallet.lockedEscrowRials.toString(),
      currency: wallet.currency,
      updatedAt: wallet.updatedAt.toISOString(),
      sourceOfTruth: "WALLET_LEDGER" as const,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
