import { AppError } from "@/lib/errors";

/**
 * Settlement is intentionally isolated from Prompt 22.
 *
 * Timesheet approval now ends at READY_FOR_SETTLEMENT. Prompt 30 will introduce
 * the payment provider and Prompt 31 the ledger-safe wallet implementation.
 * Keeping the previous direct balance mutation here would allow duplicate or
 * non-atomic credits, so the legacy entrypoint fails closed.
 */
export class SettlementService {
  async approveTimesheet(_timesheetId: string, _employerUserId: string): Promise<never> {
    throw new AppError(
      "مسیر قدیمی تسویه غیرفعال شده است. تأیید تایم‌شیت باید از TimesheetService انجام شود.",
      "CONFLICT",
      409
    );
  }
}
