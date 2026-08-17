import { AppError } from "@/lib/errors";

/**
 * Legacy compatibility shell.
 *
 * Direct balance mutation is forbidden from Prompt 31 onward. Wallet balance
 * changes must be represented by an immutable wallet_transactions entry and
 * update the wallets projection in the same DB transaction via
 * WalletLedgerService.
 *
 * Escrow locking and assignment settlement belong to Prompt 32 and remain
 * disabled here so old call sites cannot silently bypass the ledger.
 */
export class FinanceService {
  async lockEscrow(
    _employerUserId: string,
    _shiftId: string,
    _amountRials: bigint,
    _idempotencyKey: string
  ): Promise<never> {
    throw new AppError(
      "مسیر قدیمی قفل سپرده غیرفعال است. Escrow در Prompt 32 روی Wallet Ledger پیاده‌سازی می‌شود.",
      "CONFLICT",
      409
    );
  }

  async settleAssignment(
    _assignmentId: string,
    _idempotencyKey: string
  ): Promise<never> {
    throw new AppError(
      "مسیر قدیمی تسویه غیرفعال است. Settlement در Prompt 32 روی Wallet Ledger پیاده‌سازی می‌شود.",
      "CONFLICT",
      409
    );
  }
}
