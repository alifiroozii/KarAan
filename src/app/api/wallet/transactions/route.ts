import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/auth.middleware";
import { WalletLedgerService } from "@/modules/wallet/wallet-ledger.service";
import { AppError, createErrorResponse, createSuccessResponse } from "@/lib/errors";

const walletLedger = new WalletLedgerService();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).max(512).optional(),
});

function encodeCursor(cursor: { createdAt: Date; id: string } | null): string | null {
  if (!cursor) return null;
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }),
    "utf8"
  ).toString("base64url");
}

function decodeCursor(value?: string): { createdAt: Date; id: string } | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      createdAt?: unknown;
      id?: unknown;
    };
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      throw new Error("invalid cursor shape");
    }
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime()) || parsed.id.length < 3 || parsed.id.length > 128) {
      throw new Error("invalid cursor value");
    }
    return { createdAt, id: parsed.id };
  } catch {
    throw new AppError("Cursor تراکنش‌های کیف پول معتبر نیست.", "VALIDATION_ERROR", 422);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission(req, "payment.view");
    const url = new URL(req.url);
    const query = querySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    const result = await walletLedger.listTransactions(session.userId, {
      limit: query.limit,
      cursor: decodeCursor(query.cursor),
    });

    return createSuccessResponse({
      items: result.items.map((item) => ({
        transactionId: item.transactionId,
        amountRials: item.amountRials.toString(),
        direction: item.direction,
        bucket: item.bucket,
        referenceType: item.referenceType,
        referenceId: item.referenceId,
        description: item.description,
        metadata: item.metadata,
        balanceAfterRials: item.balanceAfterRials.toString(),
        createdAt: item.createdAt.toISOString(),
      })),
      nextCursor: encodeCursor(result.nextCursor),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
