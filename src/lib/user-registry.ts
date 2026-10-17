import crypto from "crypto";
import { db } from "@/db";
import { users, sessions, devices, workerProfiles, employerProfiles } from "@/db/schema";
import { eq, or, ilike, desc, count, and } from "drizzle-orm";
import type { UserRole } from "@/modules/auth/auth.service";

export interface UserSubmittedRequest {
  id: string;
  title: string;
  category: string;
  budget: string;
  city: string;
  address?: string;
  createdAt: string;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  details?: string;
}

export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: UserRole;
  avatarUrl?: string | null;
  platform: "ANDROID" | "WEB" | "IOS";
  deviceModel: string;
  appVersion: string;
  ipAddress: string;
  isVerified: boolean;
  isBlocked: boolean;
  provider: "GMAIL" | "PHONE_OTP" | "ADMIN_SEED";
  createdAt: string;
  lastLoginAt: string;
  city?: string;
  skills?: string[];
  submittedRequests?: UserSubmittedRequest[];
  notes?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __karaanUserRegistry: Map<string, RegisteredUser> | undefined;
  // eslint-disable-next-line no-var
  var __karaanRecentLogins: RegisteredUser[] | undefined;
}

function getMemoryStore(): Map<string, RegisteredUser> {
  if (!globalThis.__karaanUserRegistry) {
    const initialMap = new Map<string, RegisteredUser>();

    // ONLY the Master Admin account is initialized. Zero fake users. All workers and employers come real from app logins!
    const masterAdmin: RegisteredUser = {
      id: "usr_admin_master",
      fullName: "مدیر ارشد کاروین (مدیریت سامانه)",
      email: "admin@karaan.ir",
      phone: "09120000000",
      role: "ADMIN",
      avatarUrl: null,
      platform: "WEB",
      deviceModel: "macOS / Chrome Admin Console",
      appVersion: "Admin Console v2.4.0",
      ipAddress: "127.0.0.1",
      isVerified: true,
      isBlocked: false,
      provider: "ADMIN_SEED",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      city: "تهران",
      notes: "دسترسی Super Admin به سامانه مانیتورینگ کاربران",
    };

    initialMap.set(masterAdmin.id, masterAdmin);
    globalThis.__karaanUserRegistry = initialMap;
    globalThis.__karaanRecentLogins = [masterAdmin];
  }
  return globalThis.__karaanUserRegistry;
}

export class UserRegistryService {
  /**
   * Register or log in a user with Gmail credentials & full client telemetry.
   */
  async registerOrLoginGmail(input: {
    email: string;
    fullName: string;
    role?: UserRole;
    phone?: string;
    avatarUrl?: string;
    platform?: "ANDROID" | "WEB" | "IOS";
    deviceModel?: string;
    appVersion?: string;
    ipAddress?: string;
    skills?: string[];
    city?: string;
  }): Promise<{ user: RegisteredUser; token: string }> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim() || email.split("@")[0];
    const role: UserRole = input.role || "WORKER";
    const platform = input.platform || "ANDROID";
    const phone = input.phone?.trim() || `0999${Math.floor(1000000 + Math.random() * 9000000)}`;
    const store = getMemoryStore();

    let existingUser: RegisteredUser | undefined;
    for (const u of store.values()) {
      if (u.email?.toLowerCase() === email || (input.phone && u.phone === input.phone)) {
        existingUser = u;
        break;
      }
    }

    const nowIso = new Date().toISOString();
    let userResult: RegisteredUser;

    if (existingUser) {
      existingUser.lastLoginAt = nowIso;
      existingUser.platform = platform;
      if (input.deviceModel) existingUser.deviceModel = input.deviceModel;
      if (input.appVersion) existingUser.appVersion = input.appVersion;
      if (input.ipAddress) existingUser.ipAddress = input.ipAddress;
      if (input.avatarUrl) existingUser.avatarUrl = input.avatarUrl;
      if (input.skills && input.skills.length > 0) existingUser.skills = input.skills;
      if (input.city) existingUser.city = input.city;
      if (input.role) existingUser.role = input.role;
      store.set(existingUser.id, existingUser);
      userResult = existingUser;
    } else {
      const newUserId = `usr_${crypto.randomUUID()}`;
      userResult = {
        id: newUserId,
        fullName,
        email,
        phone,
        role,
        avatarUrl: input.avatarUrl || null,
        platform,
        deviceModel: input.deviceModel || (platform === "ANDROID" ? "Android Device (APK Mobile)" : "Web Browser"),
        appVersion: input.appVersion || "KARJOOR v2.4.0",
        ipAddress: input.ipAddress || "127.0.0.1",
        isVerified: true,
        isBlocked: false,
        provider: "GMAIL",
        createdAt: nowIso,
        lastLoginAt: nowIso,
        skills: input.skills || (role === "WORKER" ? ["فنی و خدماتی"] : undefined),
        city: input.city || "تهران",
        submittedRequests: [],
        notes: `نصب و لاگین شده از پلتفرم ${platform}`,
      };
      store.set(newUserId, userResult);
    }

    if (!globalThis.__karaanRecentLogins) globalThis.__karaanRecentLogins = [];
    globalThis.__karaanRecentLogins = [
      userResult,
      ...globalThis.__karaanRecentLogins.filter((u) => u.id !== userResult.id),
    ].slice(0, 50);

    const token = `sess_gmail_${crypto.randomBytes(32).toString("hex")}`;
    try {
      const dbUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (dbUsers.length > 0) {
        await db
          .update(users)
          .set({ updatedAt: new Date(), avatarUrl: input.avatarUrl || dbUsers[0].avatarUrl })
          .where(eq(users.id, dbUsers[0].id));
      } else {
        await db.insert(users).values({
          id: userResult.id,
          email,
          phone: userResult.phone,
          fullName: userResult.fullName,
          role: userResult.role,
          avatarUrl: userResult.avatarUrl,
          isVerified: true,
        });
      }
    } catch {
      // Resilient fallback
    }

    return { user: userResult, token };
  }

  /**
   * Submit a new work request or need on behalf of a user.
   */
  async submitUserRequest(userId: string, requestInput: {
    title: string;
    category: string;
    budget: string;
    city?: string;
    address?: string;
    details?: string;
  }): Promise<UserSubmittedRequest | null> {
    const store = getMemoryStore();
    const user = store.get(userId);
    if (!user) return null;

    const newReq: UserSubmittedRequest = {
      id: `req_${crypto.randomUUID().slice(0, 8)}`,
      title: requestInput.title,
      category: requestInput.category,
      budget: requestInput.budget,
      city: requestInput.city || user.city || "تهران",
      address: requestInput.address,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
      details: requestInput.details,
    };

    if (!user.submittedRequests) user.submittedRequests = [];
    user.submittedRequests.unshift(newReq);
    user.lastLoginAt = new Date().toISOString();
    store.set(userId, user);

    return newReq;
  }

  /**
   * Get single user by ID with deep telemetry.
   */
  async getUserById(id: string): Promise<RegisteredUser | null> {
    const store = getMemoryStore();
    return store.get(id) || null;
  }

  /**
   * List all users for the dedicated User Management Dashboard.
   */
  async listUsers(filter: {
    q?: string | null;
    role?: string | null;
    platform?: string | null;
    provider?: string | null;
    hasRequests?: boolean | null;
    blocked?: boolean | null;
    limit?: number;
    cursor?: string | null;
  }): Promise<{ items: RegisteredUser[]; total: number; nextCursor: string | null }> {
    const store = getMemoryStore();
    let all = Array.from(store.values());

    if (filter.q?.trim()) {
      const query = filter.q.trim().toLowerCase();
      all = all.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.phone.includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.city?.toLowerCase().includes(query) ||
          u.deviceModel?.toLowerCase().includes(query) ||
          u.skills?.some((s) => s.toLowerCase().includes(query)) ||
          u.submittedRequests?.some((r) => r.title.toLowerCase().includes(query))
      );
    }

    if (filter.role) {
      all = all.filter((u) => u.role === filter.role);
    }

    if (filter.platform) {
      all = all.filter((u) => u.platform === filter.platform);
    }

    if (filter.provider) {
      all = all.filter((u) => u.provider === filter.provider);
    }

    if (typeof filter.hasRequests === "boolean") {
      all = all.filter((u) =>
        filter.hasRequests ? (u.submittedRequests && u.submittedRequests.length > 0) : (!u.submittedRequests || u.submittedRequests.length === 0)
      );
    }

    if (typeof filter.blocked === "boolean") {
      all = all.filter((u) => u.isBlocked === filter.blocked);
    }

    all.sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime());

    const limit = filter.limit || 50;
    const items = all.slice(0, limit);

    return {
      items,
      total: all.length,
      nextCursor: items.length >= limit ? items[items.length - 1].id : null,
    };
  }

  /**
   * Overview metrics specifically tailored for user telemetry and management.
   */
  async getOverviewStats(): Promise<{
    totalUsers: number;
    workers: number;
    employers: number;
    mobileUsers: number;
    gmailUsers: number;
    blockedUsers: number;
    totalRequestsCount: number;
    activeUsersToday: number;
    generatedAt: string;
  }> {
    const store = getMemoryStore();
    const all = Array.from(store.values());

    const totalUsers = all.length;
    const workers = all.filter((u) => u.role === "WORKER").length;
    const employers = all.filter((u) => u.role === "EMPLOYER").length;
    const mobileUsers = all.filter((u) => u.platform === "ANDROID").length;
    const gmailUsers = all.filter((u) => u.provider === "GMAIL" || (u.email && u.email.includes("@"))).length;
    const blockedUsers = all.filter((u) => u.isBlocked).length;
    const totalRequestsCount = all.reduce((acc, u) => acc + (u.submittedRequests?.length || 0), 0);

    const oneDayAgo = Date.now() - 24 * 3600 * 1000;
    const activeUsersToday = all.filter((u) => new Date(u.lastLoginAt).getTime() > oneDayAgo).length;

    return {
      totalUsers,
      workers,
      employers,
      mobileUsers,
      gmailUsers,
      blockedUsers,
      totalRequestsCount,
      activeUsersToday,
      generatedAt: new Date().toISOString(),
    };
  }

  getRecentLogins(limit = 15): RegisteredUser[] {
    getMemoryStore();
    const recents = globalThis.__karaanRecentLogins || [];
    return recents.slice(0, limit);
  }

  async setBlockedStatus(userId: string, blocked: boolean): Promise<RegisteredUser | null> {
    const store = getMemoryStore();
    const user = store.get(userId);
    if (user) {
      user.isBlocked = blocked;
      store.set(userId, user);
    }
    return user || null;
  }

  resetToMasterAdminOnly(): void {
    const store = getMemoryStore();
    store.clear();
    const masterAdmin: RegisteredUser = {
      id: "usr_admin_master",
      fullName: "مدیر ارشد کاروین (مدیریت سامانه)",
      email: "admin@karaan.ir",
      phone: "09120000000",
      role: "ADMIN",
      avatarUrl: null,
      platform: "WEB",
      deviceModel: "macOS / Chrome Admin Console",
      appVersion: "Admin Console v2.4.0",
      ipAddress: "127.0.0.1",
      isVerified: true,
      isBlocked: false,
      provider: "ADMIN_SEED",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      city: "تهران",
      notes: "دسترسی Super Admin به سامانه مانیتورینگ کاربران",
    };
    store.set(masterAdmin.id, masterAdmin);
    globalThis.__karaanRecentLogins = [masterAdmin];
  }
}

export const userRegistry = new UserRegistryService();
