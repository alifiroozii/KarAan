import { db } from "@/db";
import { users, sessions, devices, otpCodes, workerProfiles, employerProfiles } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { getSMSAdapter } from "@/infrastructure/sms";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export type UserRole =
  | "WORKER"
  | "EMPLOYER"
  | "BRANCH_MANAGER"
  | "SHIFT_SUPERVISOR"
  | "SUPPORT_AGENT"
  | "DISPUTE_AGENT"
  | "FINANCE_ADMIN"
  | "ADMIN"
  | "SUPER_ADMIN";

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateNumericOtp(_length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
  private smsAdapter = getSMSAdapter();

  /**
   * Request OTP for a phone number with resend cooldown and rate limiting.
   */
  async requestOtp(phone: string): Promise<{ success: boolean; cooldownSeconds: number; debugCode?: string }> {
    const normalizedPhone = phone.trim();

    // Check resend cooldown (120 seconds)
    const recentOtp = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, normalizedPhone),
          gt(otpCodes.createdAt, new Date(Date.now() - 120000))
        )
      )
      .limit(1);

    if (recentOtp.length > 0) {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(recentOtp[0].createdAt).getTime()) / 1000
      );
      const remainingCooldown = Math.max(1, 120 - elapsedSeconds);
      throw new AppError(
        `لطفاً ${remainingCooldown} ثانیه دیگر جهت درخواست مجدد کد شکیبایی ورزید.`,
        "RATE_LIMITED",
        429,
        { remainingCooldown }
      );
    }

    const rawOtp = generateNumericOtp(6);
    const codeHash = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 300000); // 5 minutes expiration

    await db.insert(otpCodes).values({
      id: `otp_${crypto.randomUUID()}`,
      phone: normalizedPhone,
      code: codeHash,
      attemptCount: 0,
      isUsed: false,
      expiresAt,
    });

    // Send SMS
    await this.smsAdapter.sendOTP(normalizedPhone, rawOtp);

    return {
      success: true,
      cooldownSeconds: 120,
      debugCode: process.env.NODE_ENV === "development" ? rawOtp : undefined,
    };
  }

  /**
   * Verify session token and return user if active.
   */
  async verifyToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
    const sessionList = await db
      .select({
        userId: sessions.userId,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (sessionList.length === 0) return null;
    return { userId: sessionList[0].userId, role: sessionList[0].role as UserRole };
  }

  /**
   * Verify OTP and create user session.
   */
  async verifyOtp(
    phone: string,
    code: string,
    requestedRole: UserRole = "WORKER",
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; user: typeof users.$inferSelect; expiresAt: Date }> {
    const normalizedPhone = phone.trim();
    const inputHash = hashOtp(code.trim());

    const activeOtps = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, normalizedPhone),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .orderBy(sql`${otpCodes.createdAt} DESC`)
      .limit(1);

    if (activeOtps.length === 0) {
      throw new AppError("کد تایید منقضی شده یا وجود ندارد. مجدداً تلاش کنید.", "EXPIRED_OTP", 400);
    }

    const otpRecord = activeOtps[0];

    if (otpRecord.attemptCount >= 5) {
      await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, otpRecord.id));
      throw new AppError("تعداد تلاش‌های ناموفق بیش از حد مجاز است. درخواست کد جدید بدهید.", "MAX_ATTEMPTS_EXCEEDED", 429);
    }

    if (otpRecord.code !== inputHash) {
      await db
        .update(otpCodes)
        .set({ attemptCount: otpRecord.attemptCount + 1 })
        .where(eq(otpCodes.id, otpRecord.id));

      throw new AppError("کد تایید وارد شده اشتباه است.", "INVALID_OTP", 400);
    }

    // Mark OTP as used
    await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, otpRecord.id));

    // Lookup or create user
    const userList = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);
    let userRecord: typeof users.$inferSelect;

    if (userList.length === 0) {
      const userId = `usr_${crypto.randomUUID()}`;
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          phone: normalizedPhone,
          role: requestedRole,
          fullName: requestedRole === "WORKER" ? "کارجو جدید" : "کارفرما جدید",
          isVerified: true,
        })
        .returning();

      userRecord = newUser;

      // Auto-create role profile
      if (requestedRole === "WORKER") {
        await db.insert(workerProfiles).values({
          id: `wp_${crypto.randomUUID()}`,
          userId,
        });
      } else if (requestedRole === "EMPLOYER") {
        await db.insert(employerProfiles).values({
          id: `ep_${crypto.randomUUID()}`,
          userId,
          companyName: "کسب‌وکار جدید",
        });
      }
    } else {
      userRecord = userList[0];

      if (userRecord.isBlocked) {
        throw new AppError("حساب کاربری شما مسدود شده است.", "ACCOUNT_BLOCKED", 403);
      }
    }

    // Create session token (expires in 30 days)
    const token = `sess_${crypto.randomBytes(32).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    await db.insert(sessions).values({
      id: `sid_${crypto.randomUUID()}`,
      userId: userRecord.id,
      token,
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "Unknown Device",
      expiresAt,
    });

    // Track device
    await db.insert(devices).values({
      id: `dev_${crypto.randomUUID()}`,
      userId: userRecord.id,
      deviceToken: crypto.createHash("md5").update(userAgent || "web").digest("hex"),
      platform: "WEB",
      lastActiveAt: new Date(),
    });

    return { token, user: userRecord, expiresAt };
  }

  /**
   * Revoke a single session token.
   */
  async revokeSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  /**
   * Revoke all sessions for a user (Logout all devices).
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
