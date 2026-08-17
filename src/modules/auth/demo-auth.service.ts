import crypto from "crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  businesses,
  businessMembers,
  devices,
  employerProfiles,
  sessions,
  users,
  workerProfiles,
} from "@/db/schema";
import { AppError } from "@/lib/errors";

export type DemoRole = "WORKER" | "EMPLOYER";

const DEMO_ACCOUNTS: Record<
  DemoRole,
  { phone: string; fullName: string }
> = {
  WORKER: {
    phone: "09123456789",
    fullName: "علی رضایی (دموی کارگر)",
  },
  EMPLOYER: {
    phone: "09987654321",
    fullName: "فروشگاه‌های زنجیره‌ای آریا (دموی کارفرما)",
  },
};

const DEMO_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export class DemoAuthService {
  async createSession(
    role: DemoRole,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; expiresAt: Date; userId: string; role: DemoRole }> {
    const account = DEMO_ACCOUNTS[role];
    if (!account) {
      throw new AppError("نقش دموی نامعتبر است.", "FORBIDDEN", 403);
    }

    const userRecord = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`demo-account:${account.phone}`}))`
      );

      let [demoUser] = await tx
        .select()
        .from(users)
        .where(eq(users.phone, account.phone))
        .limit(1);

      if (demoUser && demoUser.role !== role) {
        throw new AppError(
          "شماره حساب دمو با نقش دیگری ثبت شده است.",
          "DEMO_ACCOUNT_ROLE_CONFLICT",
          409
        );
      }

      if (demoUser?.isBlocked) {
        throw new AppError("حساب دموی این نقش مسدود است.", "ACCOUNT_BLOCKED", 403);
      }

      if (!demoUser) {
        [demoUser] = await tx
          .insert(users)
          .values({
            id: `usr_${crypto.randomUUID()}`,
            phone: account.phone,
            role,
            fullName: account.fullName,
            isVerified: true,
          })
          .returning();
      } else if (!demoUser.isVerified) {
        [demoUser] = await tx
          .update(users)
          .set({ isVerified: true, updatedAt: new Date() })
          .where(eq(users.id, demoUser.id))
          .returning();
      }

      if (role === "WORKER") {
        const [profile] = await tx
          .select({ id: workerProfiles.id })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, demoUser.id))
          .limit(1);

        if (!profile) {
          await tx.insert(workerProfiles).values({
            id: `wp_${crypto.randomUUID()}`,
            userId: demoUser.id,
            bio: "حساب نمایشی کارآن برای بررسی تجربه کارگر",
            hourlyRateRials: BigInt(1_500_000),
            reliabilityScore: "98.50",
            verificationStatus: "VERIFIED",
            isAvailable: true,
          });
        } else {
          await tx
            .update(workerProfiles)
            .set({
              verificationStatus: "VERIFIED",
              isAvailable: true,
              updatedAt: new Date(),
            })
            .where(eq(workerProfiles.id, profile.id));
        }
      } else {
        let [profile] = await tx
          .select()
          .from(employerProfiles)
          .where(eq(employerProfiles.userId, demoUser.id))
          .limit(1);

        if (!profile) {
          [profile] = await tx
            .insert(employerProfiles)
            .values({
              id: `ep_${crypto.randomUUID()}`,
              userId: demoUser.id,
              companyName: "فروشگاه‌های زنجیره‌ای آریا",
            })
            .returning();
        }

        let [business] = await tx
          .select()
          .from(businesses)
          .where(eq(businesses.employerProfileId, profile.id))
          .limit(1);

        if (!business) {
          [business] = await tx
            .insert(businesses)
            .values({
              id: `biz_${crypto.randomUUID()}`,
              employerProfileId: profile.id,
              name: "فروشگاه‌های زنجیره‌ای آریا",
              category: "فروشگاهی",
              description: "کسب‌وکار نمایشی برای مرور قابلیت‌های پنل کارفرما",
            })
            .returning();
        }

        const [member] = await tx
          .select({ id: businessMembers.id })
          .from(businessMembers)
          .where(
            and(
              eq(businessMembers.businessId, business.id),
              eq(businessMembers.userId, demoUser.id)
            )
          )
          .limit(1);

        if (!member) {
          await tx.insert(businessMembers).values({
            id: `bm_${crypto.randomUUID()}`,
            businessId: business.id,
            userId: demoUser.id,
            role: "OWNER",
            permissions: [],
          });
        }

        const [branch] = await tx
          .select({ id: branches.id })
          .from(branches)
          .where(eq(branches.businessId, business.id))
          .limit(1);

        if (!branch) {
          await tx.insert(branches).values({
            id: `br_${crypto.randomUUID()}`,
            businessId: business.id,
            name: "شعبه نمایشی انقلاب",
            address: "تهران، میدان انقلاب، خیابان کارگر شمالی",
            latitude: 35.7000,
            longitude: 51.3500,
            phone: "02166400000",
            managerUserId: demoUser.id,
          });
        }
      }

      return demoUser;
    });

    const [activeSession] = await db
      .select({ token: sessions.token, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userRecord.id),
          gt(sessions.expiresAt, new Date())
        )
      )
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (activeSession) {
      return {
        token: activeSession.token,
        expiresAt: activeSession.expiresAt,
        userId: userRecord.id,
        role,
      };
    }

    const token = `sess_demo_${crypto.randomBytes(32).toString("hex")}`;
    const expiresAt = new Date(Date.now() + DEMO_SESSION_TTL_MS);

    await db.transaction(async (tx) => {
      await tx.insert(sessions).values({
        id: `sid_${crypto.randomUUID()}`,
        userId: userRecord.id,
        token,
        ipAddress: ipAddress || "demo",
        userAgent: userAgent || "KarAan Demo Browser",
        expiresAt,
      });

      await tx.insert(devices).values({
        id: `dev_${crypto.randomUUID()}`,
        userId: userRecord.id,
        deviceToken: crypto
          .createHash("sha256")
          .update(`demo:${userAgent || "web"}`)
          .digest("hex"),
        platform: "WEB",
        lastActiveAt: new Date(),
      });
    });

    return { token, expiresAt, userId: userRecord.id, role };
  }
}
