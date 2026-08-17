import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizedOrigin(value: string) {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function expectedOrigin(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.nextUrl.protocol.replace(":", "");
  const host = forwardedHost || req.headers.get("host") || req.nextUrl.host;
  return `${protocol}://${host}`.toLowerCase();
}

/**
 * CSRF boundary for authenticated browser mutations.
 *
 * Bearer-token clients are not vulnerable to ambient-cookie CSRF and are left
 * available for native/mobile/server-to-server callers. Cookie-authenticated
 * mutations must originate from the exact KarAan origin.
 */
export function assertSafeMutationOrigin(req: NextRequest): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return;

  const hasSessionCookie = Boolean(req.cookies.get("karaan_session")?.value);
  if (!hasSessionCookie) return;

  if (req.headers.get("sec-fetch-site") === "cross-site") {
    throw new AppError("درخواست cross-site برای عملیات احرازشده مجاز نیست.", "FORBIDDEN", 403);
  }

  const expected = expectedOrigin(req);
  const origin = req.headers.get("origin");
  if (origin) {
    if (normalizedOrigin(origin) !== expected) {
      throw new AppError("Origin درخواست معتبر نیست.", "FORBIDDEN", 403);
    }
    return;
  }

  const referer = req.headers.get("referer");
  if (referer && normalizedOrigin(referer) === expected) return;

  throw new AppError(
    "برای عملیات احرازشده با Cookie، Origin یا Referer معتبر الزامی است.",
    "FORBIDDEN",
    403
  );
}
