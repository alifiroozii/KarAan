import { NextRequest } from "next/server";
import { AuthService } from "./auth.service";
import { AuthSession, UserRole } from "./auth.types";
import { Permission, assertPermission, assertOwnership } from "./permissions";
import { AppError } from "@/lib/errors";

const authService = new AuthService();

export async function getSessionFromRequest(req: NextRequest): Promise<AuthSession | null> {
  let token: string | undefined;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = req.cookies.get("karaan_session")?.value;
  }

  if (!token) return null;

  const result = await authService.verifyToken(token);
  if (!result) return null;

  return {
    userId: result.userId,
    phone: "",
    role: result.role,
    fullName: "",
  };
}

export async function requireAuth(req: NextRequest): Promise<AuthSession> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    throw new AppError("لطفاً ابتدا وارد حساب کاربری خود شوید.", "UNAUTHORIZED", 401);
  }
  return session;
}

export async function requireRole(req: NextRequest, allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth(req);
  if (!allowedRoles.includes(session.role)) {
    throw new AppError("شما مجوز دسترسی به این بخش را ندارید.", "FORBIDDEN", 403);
  }
  return session;
}

export async function requirePermission(req: NextRequest, permission: Permission): Promise<AuthSession> {
  const session = await requireAuth(req);
  assertPermission(session.role, permission);
  return session;
}

export async function requireOwnership(
  actorUserId: string,
  resourceOwnerId: string,
  actorRole?: UserRole
): Promise<void> {
  assertOwnership(actorUserId, resourceOwnerId, actorRole);
}
