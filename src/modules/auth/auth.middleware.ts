import { NextRequest } from "next/server";
import { AuthService } from "./auth.service";
import { AuthSession, UserRole } from "./auth.types";
import { AppError } from "@/lib/errors";

const authService = new AuthService();

export function getSessionFromRequest(req: NextRequest): AuthSession | null {
  // Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const session = authService.verifyToken(token);
    if (session) return session;
  }

  // Check Cookie
  const cookieToken = req.cookies.get("karaan_session")?.value;
  if (cookieToken) {
    const session = authService.verifyToken(cookieToken);
    if (session) return session;
  }

  return null;
}

export function requireAuth(req: NextRequest): AuthSession {
  const session = getSessionFromRequest(req);
  if (!session) {
    throw new AppError("لطفاً ابتدا وارد حساب کاربری خود شوید.", "UNAUTHORIZED", 401);
  }
  return session;
}

export function requireRole(req: NextRequest, allowedRoles: UserRole[]): AuthSession {
  const session = requireAuth(req);
  if (!allowedRoles.includes(session.role)) {
    throw new AppError("شما مجوز دسترسی به این بخش را ندارید.", "FORBIDDEN", 403);
  }
  return session;
}
