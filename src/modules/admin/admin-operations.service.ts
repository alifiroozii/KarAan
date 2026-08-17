import crypto from "crypto";
import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, disputes, sessions, shifts, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/modules/auth/auth.service";
import { hasPermission } from "@/modules/auth/permissions";

const ACTIVE_SHIFT_STATUSES = [
  "PUBLISHED",
  "MATCHING",
  "PARTIALLY_FILLED",
  "FILLED",
  "CONFIRMED",
  "IN_PROGRESS",
] as const;

const PRIVILEGED_TARGET_ROLES = new Set<UserRole>(["ADMIN", "SUPER_ADMIN"]);

interface CursorPayload {
  timestamp: string;
  id: string;
}

function encodeCursor(timestamp: Date, id: string) {
  return Buffer.from(JSON.stringify({ timestamp: timestamp.toISOString(), id } satisfies CursorPayload)).toString("base64url");
}

function decodeCursor(value?: string | null): CursorPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as CursorPayload;
    const date = new Date(parsed.timestamp);
    if (!parsed.id || Number.isNaN(date.getTime())) throw new Error("invalid cursor");
    return { timestamp: date.toISOString(), id: parsed.id };
  } catch {
    throw new AppError("Cursor معتبر نیست.", "VALIDATION_ERROR", 422);
  }
}

function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (/(password|secret|token|authorization|otp|code)/i.test(key)) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactSensitive(nested);
    }
  }
  return result;
}

function serializeUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    role: row.role,
    fullName: row.fullName,
    isVerified: row.isVerified,
    isBlocked: row.isBlocked,
    twoFactorEnabled: row.twoFactorEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class AdminOperationsService {
  async getOverview(actorRole: UserRole) {
    if (!hasPermission(actorRole, "admin.audit.view")) {
      throw new AppError("مجوز مشاهده داشبورد مدیریتی را ندارید.", "FORBIDDEN", 403);
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      workers,
      employers,
      blockedUsers,
      activeShifts,
      openDisputes,
      auditEvents24h,
    ] = await Promise.all([
      db.select({ value: count(users.id) }).from(users),
      db.select({ value: count(users.id) }).from(users).where(eq(users.role, "WORKER")),
      db.select({ value: count(users.id) }).from(users).where(eq(users.role, "EMPLOYER")),
      db.select({ value: count(users.id) }).from(users).where(eq(users.isBlocked, true)),
      db.select({ value: count(shifts.id) }).from(shifts).where(inArray(shifts.status, [...ACTIVE_SHIFT_STATUSES])),
      db
        .select({ value: count(disputes.id) })
        .from(disputes)
        .where(inArray(disputes.status, ["OPEN", "UNDER_REVIEW"])),
      db
        .select({ value: count(auditLogs.id) })
        .from(auditLogs)
        .where(gt(auditLogs.timestamp, since24h)),
    ]);

    return {
      totalUsers: totalUsers[0]?.value ?? 0,
      workers: workers[0]?.value ?? 0,
      employers: employers[0]?.value ?? 0,
      blockedUsers: blockedUsers[0]?.value ?? 0,
      activeShifts: activeShifts[0]?.value ?? 0,
      openDisputes: openDisputes[0]?.value ?? 0,
      auditEvents24h: auditEvents24h[0]?.value ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }

  async listUsers(
    actorRole: UserRole,
    input: {
      q?: string | null;
      role?: UserRole | null;
      blocked?: boolean | null;
      cursor?: string | null;
      limit?: number;
    }
  ) {
    if (!hasPermission(actorRole, "admin.users.manage")) {
      throw new AppError("مجوز مدیریت کاربران را ندارید.", "FORBIDDEN", 403);
    }

    const limit = Math.min(Math.max(input.limit ?? 30, 1), 50);
    const cursor = decodeCursor(input.cursor);
    const conditions = [];
    const q = input.q?.trim();
    if (q) {
      const pattern = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
      conditions.push(or(ilike(users.fullName, pattern), ilike(users.phone, pattern), ilike(users.email, pattern))!);
    }
    if (input.role) conditions.push(eq(users.role, input.role));
    if (typeof input.blocked === "boolean") conditions.push(eq(users.isBlocked, input.blocked));
    if (cursor) {
      const cursorDate = new Date(cursor.timestamp);
      conditions.push(
        or(
          lt(users.createdAt, cursorDate),
          and(eq(users.createdAt, cursorDate), lt(users.id, cursor.id))
        )!
      );
    }

    const rows = await db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const last = pageRows[pageRows.length - 1];
    return {
      items: pageRows.map(serializeUser),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  private assertUserMutationAllowed(actorUserId: string, actorRole: UserRole, target: typeof users.$inferSelect) {
    if (!hasPermission(actorRole, "admin.users.manage")) {
      throw new AppError("مجوز مدیریت کاربران را ندارید.", "FORBIDDEN", 403);
    }
    if (actorUserId === target.id) {
      throw new AppError("تغییر وضعیت حساب خودتان از این مسیر مجاز نیست.", "CONFLICT", 409);
    }
    if (actorRole !== "SUPER_ADMIN" && PRIVILEGED_TARGET_ROLES.has(target.role)) {
      throw new AppError("فقط SUPER_ADMIN می‌تواند وضعیت مدیران سطح بالا را تغییر دهد.", "FORBIDDEN", 403);
    }
  }

  async setBlockedStatus(
    targetUserId: string,
    actorUserId: string,
    actorRole: UserRole,
    input: { blocked: boolean; reason: string; ipAddress?: string | null }
  ) {
    const reason = input.reason.trim();
    if (reason.length < 5 || reason.length > 500) {
      throw new AppError("دلیل تغییر وضعیت باید بین ۵ تا ۵۰۰ کاراکتر باشد.", "VALIDATION_ERROR", 422);
    }

    let idempotent = false;
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`admin-user:${targetUserId}`}))`);
      const [target] = await tx.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      if (!target) throw new AppError("کاربر پیدا نشد.", "NOT_FOUND", 404);
      this.assertUserMutationAllowed(actorUserId, actorRole, target);

      if (target.isBlocked === input.blocked) {
        idempotent = true;
        return target;
      }

      const now = new Date();
      const [updated] = await tx
        .update(users)
        .set({ isBlocked: input.blocked, updatedAt: now })
        .where(eq(users.id, targetUserId))
        .returning();

      let revokedSessions = 0;
      if (input.blocked) {
        const deleted = await tx.delete(sessions).where(eq(sessions.userId, targetUserId)).returning({ id: sessions.id });
        revokedSessions = deleted.length;
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: actorUserId,
        entityName: "user",
        entityId: targetUserId,
        action: input.blocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
        details: {
          reason,
          targetRole: target.role,
          previousBlocked: target.isBlocked,
          blocked: input.blocked,
          revokedSessions,
        },
        ipAddress: input.ipAddress ?? null,
        timestamp: now,
      });
      return updated;
    });

    return { user: serializeUser(result), idempotent };
  }

  async listAuditLogs(
    actorRole: UserRole,
    input: {
      q?: string | null;
      actorId?: string | null;
      entityName?: string | null;
      action?: string | null;
      cursor?: string | null;
      limit?: number;
    }
  ) {
    if (!hasPermission(actorRole, "admin.audit.view")) {
      throw new AppError("مجوز مشاهده Audit Log را ندارید.", "FORBIDDEN", 403);
    }

    const limit = Math.min(Math.max(input.limit ?? 40, 1), 100);
    const cursor = decodeCursor(input.cursor);
    const conditions = [];
    const q = input.q?.trim();
    if (q) {
      const pattern = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
      conditions.push(
        or(
          ilike(auditLogs.action, pattern),
          ilike(auditLogs.entityName, pattern),
          ilike(auditLogs.entityId, pattern)
        )!
      );
    }
    if (input.actorId) conditions.push(eq(auditLogs.actorId, input.actorId));
    if (input.entityName) conditions.push(eq(auditLogs.entityName, input.entityName));
    if (input.action) conditions.push(eq(auditLogs.action, input.action));
    if (cursor) {
      const cursorDate = new Date(cursor.timestamp);
      conditions.push(
        or(
          lt(auditLogs.timestamp, cursorDate),
          and(eq(auditLogs.timestamp, cursorDate), lt(auditLogs.id, cursor.id))
        )!
      );
    }

    const rows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorName: users.fullName,
        entityName: auditLogs.entityName,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        timestamp: auditLogs.timestamp,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp), desc(auditLogs.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const last = pageRows[pageRows.length - 1];
    return {
      items: pageRows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        actorName: row.actorName,
        entityName: row.entityName,
        entityId: row.entityId,
        action: row.action,
        details: redactSensitive(row.details),
        ipAddress: row.ipAddress,
        timestamp: row.timestamp.toISOString(),
      })),
      nextCursor: hasMore && last ? encodeCursor(last.timestamp, last.id) : null,
    };
  }
}
