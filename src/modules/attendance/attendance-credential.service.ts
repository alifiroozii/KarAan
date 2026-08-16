import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  businesses,
  businessMembers,
  employerProfiles,
} from "@/db/schema/employers";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { redis } from "@/infrastructure/redis/redis-client";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/modules/auth/auth.service";

export type AttendancePurpose = "CHECK_IN" | "CHECK_OUT";
export type AttendanceCredentialKind = "QR" | "SUPERVISOR_CODE";

export interface AttendanceCredentialMetadata {
  credentialId: string;
  kind: AttendanceCredentialKind;
  branchId: string;
  purpose: AttendancePurpose;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  singleUse: boolean;
}

const QR_PREFIX = "karaan:attendance:qr:";
const CODE_PREFIX = "karaan:attendance:code:";

export function hashAttendanceCredential(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function buildSupervisorCodeHash(
  branchId: string,
  purpose: AttendancePurpose,
  code: string
): string {
  return hashAttendanceCredential(`${branchId}:${purpose}:${code}`);
}

async function ensureRedis(): Promise<void> {
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }
  } catch {
    throw new AppError(
      "سرویس اعتبارسنجی حضور در دسترس نیست. دوباره تلاش کنید.",
      "INTERNAL_SERVER_ERROR",
      503
    );
  }
}

export class AttendanceCredentialService {
  private async readSecondsSetting(key: string, fallback: number): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(5, raw);
    if (raw && typeof raw === "object" && "seconds" in raw) {
      const seconds = Number((raw as Record<string, unknown>).seconds);
      if (Number.isFinite(seconds)) return Math.max(5, seconds);
    }
    return fallback;
  }

  async assertBranchAttendanceAccess(
    branchId: string,
    actorUserId: string,
    actorRole: UserRole
  ): Promise<void> {
    if (actorRole === "ADMIN" || actorRole === "SUPER_ADMIN") return;

    const [branch] = await db
      .select({
        id: branches.id,
        managerUserId: branches.managerUserId,
        businessId: branches.businessId,
        ownerUserId: employerProfiles.userId,
      })
      .from(branches)
      .innerJoin(businesses, eq(businesses.id, branches.businessId))
      .innerJoin(
        employerProfiles,
        eq(employerProfiles.id, businesses.employerProfileId)
      )
      .where(eq(branches.id, branchId))
      .limit(1);

    if (!branch) throw new AppError("شعبه پیدا نشد.", "NOT_FOUND", 404);
    if (branch.ownerUserId === actorUserId || branch.managerUserId === actorUserId) return;

    const [member] = await db
      .select({ id: businessMembers.id })
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, branch.businessId),
          eq(businessMembers.userId, actorUserId)
        )
      )
      .limit(1);

    if (!member) {
      throw new AppError("دسترسی مدیریت حضور این شعبه را ندارید.", "FORBIDDEN", 403);
    }
  }

  async issueQrCredential(input: {
    branchId: string;
    purpose: AttendancePurpose;
    actorUserId: string;
    actorRole: UserRole;
  }) {
    await this.assertBranchAttendanceAccess(
      input.branchId,
      input.actorUserId,
      input.actorRole
    );
    await ensureRedis();

    const ttlSeconds = await this.readSecondsSetting("attendance.qr_ttl_seconds", 45);
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashAttendanceCredential(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const credentialId = `acred_${crypto.randomUUID()}`;

    const metadata: AttendanceCredentialMetadata = {
      credentialId,
      kind: "QR",
      branchId: input.branchId,
      purpose: input.purpose,
      issuedBy: input.actorUserId,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      singleUse: false,
    };

    const saved = await redis.set(
      `${QR_PREFIX}${tokenHash}`,
      JSON.stringify(metadata),
      "EX",
      ttlSeconds,
      "NX"
    );
    if (saved !== "OK") {
      throw new AppError("ایجاد QR حضور ناموفق بود.", "INTERNAL_SERVER_ERROR", 503);
    }

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: input.actorUserId,
      entityName: "branch",
      entityId: input.branchId,
      action: "ATTENDANCE_QR_GENERATED",
      details: {
        credentialId,
        purpose: input.purpose,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      credentialId,
      token: rawToken,
      purpose: input.purpose,
      branchId: input.branchId,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds,
    };
  }

  async issueSupervisorCode(input: {
    branchId: string;
    purpose: AttendancePurpose;
    actorUserId: string;
    actorRole: UserRole;
  }) {
    await this.assertBranchAttendanceAccess(
      input.branchId,
      input.actorUserId,
      input.actorRole
    );
    await ensureRedis();

    const ttlSeconds = await this.readSecondsSetting(
      "attendance.supervisor_code_ttl_seconds",
      120
    );
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = buildSupervisorCodeHash(input.branchId, input.purpose, code);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const credentialId = `acred_${crypto.randomUUID()}`;

    const metadata: AttendanceCredentialMetadata = {
      credentialId,
      kind: "SUPERVISOR_CODE",
      branchId: input.branchId,
      purpose: input.purpose,
      issuedBy: input.actorUserId,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      singleUse: true,
    };

    await redis.set(
      `${CODE_PREFIX}${codeHash}`,
      JSON.stringify(metadata),
      "EX",
      ttlSeconds
    );

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: input.actorUserId,
      entityName: "branch",
      entityId: input.branchId,
      action: "ATTENDANCE_CODE_GENERATED",
      details: {
        credentialId,
        purpose: input.purpose,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      credentialId,
      code,
      purpose: input.purpose,
      branchId: input.branchId,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds,
    };
  }

  async resolveQrToken(rawToken: string): Promise<AttendanceCredentialMetadata> {
    await ensureRedis();
    const tokenHash = hashAttendanceCredential(rawToken);
    const raw = await redis.get(`${QR_PREFIX}${tokenHash}`);
    if (!raw) {
      throw new AppError("QR نامعتبر یا منقضی شده است.", "QR_EXPIRED", 400);
    }

    try {
      return JSON.parse(raw) as AttendanceCredentialMetadata;
    } catch {
      throw new AppError("QR معتبر نیست.", "QR_INVALID", 400);
    }
  }

  async resolveSupervisorCode(input: {
    branchId: string;
    purpose: AttendancePurpose;
    code: string;
  }): Promise<AttendanceCredentialMetadata> {
    await ensureRedis();
    const codeHash = buildSupervisorCodeHash(input.branchId, input.purpose, input.code);
    const raw = await redis.get(`${CODE_PREFIX}${codeHash}`);
    if (!raw) {
      throw new AppError(
        "کد مسئول نامعتبر یا منقضی شده است.",
        "ATTENDANCE_CODE_EXPIRED",
        400
      );
    }

    try {
      return JSON.parse(raw) as AttendanceCredentialMetadata;
    } catch {
      throw new AppError("کد مسئول معتبر نیست.", "ATTENDANCE_CODE_INVALID", 400);
    }
  }

  async revokeSupervisorCode(input: {
    branchId: string;
    purpose: AttendancePurpose;
    code: string;
  }): Promise<void> {
    await ensureRedis();
    const codeHash = buildSupervisorCodeHash(input.branchId, input.purpose, input.code);
    await redis.del(`${CODE_PREFIX}${codeHash}`);
  }
}
