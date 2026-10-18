import crypto from "crypto";
import { db, sql } from "@/db";
import { registeredUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { UserRole } from "@/modules/auth/auth.service";

export interface UserSubmittedRequest {
  id: string;
  title: string;
  category: string;
  budget: string;
  city: string;
  address?: string;
  createdAt: string;
  status: "ACTIVE" | "APPROVED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  details?: string;
  updatedAt?: string;
  approvedAt?: string;
  notes?: string;
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
  // eslint-disable-next-line no-var
  var __karaanDbTableInitialized: boolean | undefined;
}

const MASTER_ADMIN: RegisteredUser = {
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

function getMemoryStore(): Map<string, RegisteredUser> {
  if (!globalThis.__karaanUserRegistry) {
    const initialMap = new Map<string, RegisteredUser>();
    initialMap.set(MASTER_ADMIN.id, { ...MASTER_ADMIN });
    globalThis.__karaanUserRegistry = initialMap;
    globalThis.__karaanRecentLogins = [{ ...MASTER_ADMIN }];
  }
  return globalThis.__karaanUserRegistry;
}

function mapDbRowToRegisteredUser(row: any): RegisteredUser {
  let parsedSkills: string[] = [];
  if (Array.isArray(row.skills)) {
    parsedSkills = row.skills;
  } else if (typeof row.skills === "string") {
    try {
      parsedSkills = JSON.parse(row.skills);
    } catch {
      parsedSkills = [];
    }
  }

  let parsedRequests: UserSubmittedRequest[] = [];
  const reqData = row.submitted_requests ?? row.submittedRequests;
  if (Array.isArray(reqData)) {
    parsedRequests = reqData;
  } else if (typeof reqData === "string") {
    try {
      parsedRequests = JSON.parse(reqData);
    } catch {
      parsedRequests = [];
    }
  }

  return {
    id: String(row.id),
    fullName: String(row.full_name ?? row.fullName ?? ""),
    email: row.email ? String(row.email) : null,
    phone: String(row.phone ?? ""),
    role: (row.role as UserRole) || "WORKER",
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    platform: (row.platform as "ANDROID" | "WEB" | "IOS") || "WEB",
    deviceModel: String(row.device_model ?? row.deviceModel ?? "Web Browser"),
    appVersion: String(row.app_version ?? row.appVersion ?? "KARJOOR v2.4.0"),
    ipAddress: String(row.ip_address ?? row.ipAddress ?? "127.0.0.1"),
    isVerified: Boolean(row.is_verified ?? row.isVerified ?? true),
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked ?? false),
    provider: (row.provider as "GMAIL" | "PHONE_OTP" | "ADMIN_SEED") || "GMAIL",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : new Date().toISOString(),
    city: row.city ? String(row.city) : "تهران",
    skills: parsedSkills,
    submittedRequests: parsedRequests,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export class UserRegistryService {
  /**
   * Ensure the persistent database table exists in PostgreSQL.
   */
  async ensureDbTable(): Promise<boolean> {
    if (globalThis.__karaanDbTableInitialized) return true;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS registered_users (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'WORKER',
          avatar_url TEXT,
          platform TEXT NOT NULL DEFAULT 'WEB',
          device_model TEXT NOT NULL DEFAULT 'Web Browser',
          app_version TEXT NOT NULL DEFAULT 'KARJOOR v2.4.0',
          ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
          is_verified BOOLEAN NOT NULL DEFAULT true,
          is_blocked BOOLEAN NOT NULL DEFAULT false,
          provider TEXT NOT NULL DEFAULT 'GMAIL',
          city TEXT DEFAULT 'تهران',
          skills JSONB DEFAULT '[]'::jsonb,
          submitted_requests JSONB DEFAULT '[]'::jsonb,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_reg_users_email ON registered_users(email);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reg_users_phone ON registered_users(phone);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reg_users_role ON registered_users(role);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reg_users_last_login ON registered_users(last_login_at DESC);`;

      // Seed Master Admin if completely empty
      const countRes = await sql`SELECT count(*)::int as count FROM registered_users;`;
      if ((countRes[0]?.count ?? 0) === 0) {
        await sql`
          INSERT INTO registered_users (
            id, full_name, email, phone, role, platform, device_model, app_version, ip_address, is_verified, is_blocked, provider, city, notes, created_at, last_login_at
          ) VALUES (
            ${MASTER_ADMIN.id}, ${MASTER_ADMIN.fullName}, ${MASTER_ADMIN.email}, ${MASTER_ADMIN.phone}, ${MASTER_ADMIN.role}, ${MASTER_ADMIN.platform}, ${MASTER_ADMIN.deviceModel}, ${MASTER_ADMIN.appVersion}, ${MASTER_ADMIN.ipAddress}, ${MASTER_ADMIN.isVerified}, ${MASTER_ADMIN.isBlocked}, ${MASTER_ADMIN.provider}, ${MASTER_ADMIN.city ?? null}, ${MASTER_ADMIN.notes ?? null}, NOW(), NOW()
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }
      globalThis.__karaanDbTableInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

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

    // Persistent storage in PostgreSQL
    try {
      await this.ensureDbTable();
      await sql`
        INSERT INTO registered_users (
          id, full_name, email, phone, role, avatar_url, platform, device_model, app_version, ip_address, is_verified, is_blocked, provider, city, skills, submitted_requests, notes, created_at, last_login_at
        ) VALUES (
          ${userResult.id},
          ${userResult.fullName},
          ${userResult.email},
          ${userResult.phone},
          ${userResult.role},
          ${userResult.avatarUrl ?? null},
          ${userResult.platform},
          ${userResult.deviceModel},
          ${userResult.appVersion},
          ${userResult.ipAddress},
          ${userResult.isVerified},
          ${userResult.isBlocked},
          ${userResult.provider},
          ${userResult.city ?? null},
          ${JSON.stringify(userResult.skills || [])}::jsonb,
          ${JSON.stringify(userResult.submittedRequests || [])}::jsonb,
          ${userResult.notes ?? null},
          ${userResult.createdAt},
          ${userResult.lastLoginAt}
        )
        ON CONFLICT (email) DO UPDATE SET
          last_login_at = EXCLUDED.last_login_at,
          role = EXCLUDED.role,
          platform = EXCLUDED.platform,
          device_model = EXCLUDED.device_model,
          app_version = EXCLUDED.app_version,
          ip_address = EXCLUDED.ip_address,
          skills = EXCLUDED.skills,
          city = EXCLUDED.city;
      `;
    } catch {
      // In-memory fallback
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

    // Update DB
    try {
      await this.ensureDbTable();
      await sql`
        UPDATE registered_users
        SET submitted_requests = ${JSON.stringify(user.submittedRequests)}::jsonb,
            last_login_at = ${user.lastLoginAt}
        WHERE id = ${userId};
      `;
    } catch {
      // Resilient fallback
    }

    return newReq;
  }

  /**
   * Find a user by ID, email, or phone.
   */
  async findUser(query: { id?: string; email?: string; phone?: string }): Promise<RegisteredUser | null> {
    const store = getMemoryStore();
    if (query.id && store.has(query.id)) {
      return store.get(query.id) || null;
    }
    const cleanEmail = query.email?.trim().toLowerCase();
    const cleanPhone = query.phone?.trim();

    for (const u of store.values()) {
      if (cleanEmail && u.email?.toLowerCase() === cleanEmail) return u;
      if (cleanPhone && u.phone === cleanPhone) return u;
    }

    try {
      await this.ensureDbTable();
      if (query.id) {
        const rows = await sql`SELECT * FROM registered_users WHERE id = ${query.id} LIMIT 1;`;
        if (rows.length > 0) return mapDbRowToRegisteredUser(rows[0]);
      }
      if (cleanEmail) {
        const rows = await sql`SELECT * FROM registered_users WHERE email = ${cleanEmail} LIMIT 1;`;
        if (rows.length > 0) return mapDbRowToRegisteredUser(rows[0]);
      }
      if (cleanPhone) {
        const rows = await sql`SELECT * FROM registered_users WHERE phone = ${cleanPhone} LIMIT 1;`;
        if (rows.length > 0) return mapDbRowToRegisteredUser(rows[0]);
      }
    } catch {
      // In-memory fallback
    }

    return null;
  }

  /**
   * Update the status and approval state of a submitted request.
   */
  async updateRequestStatus(
    requestId: string,
    status: "ACTIVE" | "APPROVED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    notes?: string
  ): Promise<UserSubmittedRequest | null> {
    const store = getMemoryStore();
    let targetUser: RegisteredUser | null = null;
    let targetReq: UserSubmittedRequest | null = null;

    for (const user of store.values()) {
      const found = user.submittedRequests?.find((r) => r.id === requestId);
      if (found) {
        targetUser = user;
        targetReq = found;
        break;
      }
    }

    if (!targetUser || !targetReq) {
      // Try searching DB
      try {
        await this.ensureDbTable();
        const rows = await sql`
          SELECT * FROM registered_users
          WHERE submitted_requests @> ${JSON.stringify([{ id: requestId }])}::jsonb
          LIMIT 1;
        `;
        if (rows.length > 0) {
          targetUser = mapDbRowToRegisteredUser(rows[0]);
          store.set(targetUser.id, targetUser);
          targetReq = targetUser.submittedRequests?.find((r) => r.id === requestId) || null;
        }
      } catch {
        // Fallback
      }
    }

    if (!targetUser || !targetReq) return null;

    targetReq.status = status;
    targetReq.updatedAt = new Date().toISOString();
    if (status === "APPROVED" || status === "ACCEPTED") {
      targetReq.approvedAt = new Date().toISOString();
    }
    if (notes) {
      targetReq.notes = notes;
    }

    targetUser.lastLoginAt = new Date().toISOString();
    store.set(targetUser.id, targetUser);

    try {
      await this.ensureDbTable();
      await sql`
        UPDATE registered_users
        SET submitted_requests = ${JSON.stringify(targetUser.submittedRequests)}::jsonb,
            last_login_at = ${targetUser.lastLoginAt}
        WHERE id = ${targetUser.id};
      `;
    } catch {
      // In-memory fallback
    }

    return targetReq;
  }

  /**
   * Set user identity verification status.
   */
  async setUserVerification(userId: string, isVerified: boolean): Promise<RegisteredUser | null> {
    const store = getMemoryStore();
    const user = store.get(userId);
    if (user) {
      user.isVerified = isVerified;
      store.set(userId, user);
    }
    try {
      await this.ensureDbTable();
      await sql`
        UPDATE registered_users
        SET is_verified = ${isVerified}
        WHERE id = ${userId};
      `;
    } catch {
      // In-memory fallback
    }
    return user || null;
  }

  /**
   * Get single user by ID with deep telemetry.
   */
  async getUserById(id: string): Promise<RegisteredUser | null> {
    try {
      await this.ensureDbTable();
      const rows = await sql`SELECT * FROM registered_users WHERE id = ${id} LIMIT 1;`;
      if (rows.length > 0) {
        return mapDbRowToRegisteredUser(rows[0]);
      }
    } catch {
      // Fallback to memory
    }
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
    // Try reading from Postgres first
    try {
      await this.ensureDbTable();
      const rows = await sql`
        SELECT * FROM registered_users
        ORDER BY last_login_at DESC;
      `;
      if (rows && rows.length > 0) {
        let items = rows.map(mapDbRowToRegisteredUser);

        // Also sync memory store with DB items
        const store = getMemoryStore();
        for (const item of items) {
          store.set(item.id, item);
        }

        if (filter.q?.trim()) {
          const query = filter.q.trim().toLowerCase();
          items = items.filter(
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
          items = items.filter((u) => u.role === filter.role);
        }

        if (filter.platform) {
          items = items.filter((u) => u.platform === filter.platform);
        }

        if (filter.provider) {
          items = items.filter((u) => u.provider === filter.provider);
        }

        if (typeof filter.hasRequests === "boolean") {
          items = items.filter((u) =>
            filter.hasRequests
              ? u.submittedRequests && u.submittedRequests.length > 0
              : !u.submittedRequests || u.submittedRequests.length === 0
          );
        }

        if (typeof filter.blocked === "boolean") {
          items = items.filter((u) => u.isBlocked === filter.blocked);
        }

        const limit = filter.limit || 50;
        const pageItems = items.slice(0, limit);

        return {
          items: pageItems,
          total: items.length,
          nextCursor: pageItems.length >= limit ? pageItems[pageItems.length - 1].id : null,
        };
      }
    } catch {
      // Resilient fallback to memory
    }

    // Memory store fallback
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
        filter.hasRequests
          ? u.submittedRequests && u.submittedRequests.length > 0
          : !u.submittedRequests || u.submittedRequests.length === 0
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
    // Try from database
    try {
      await this.ensureDbTable();
      const rows = await sql`SELECT * FROM registered_users;`;
      if (rows && rows.length > 0) {
        const all = rows.map(mapDbRowToRegisteredUser);
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
    } catch {
      // Memory fallback
    }

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
    try {
      await this.ensureDbTable();
      await sql`
        UPDATE registered_users
        SET is_blocked = ${blocked}
        WHERE id = ${userId};
      `;
    } catch {
      // Resilient fallback
    }
    return user || null;
  }

  resetToMasterAdminOnly(): void {
    const store = getMemoryStore();
    store.clear();
    store.set(MASTER_ADMIN.id, { ...MASTER_ADMIN });
    globalThis.__karaanRecentLogins = [{ ...MASTER_ADMIN }];

    try {
      this.ensureDbTable().then(() => {
        sql`DELETE FROM registered_users WHERE id != ${MASTER_ADMIN.id};`.catch(() => {});
      });
    } catch {
      // Resilient fallback
    }
  }
}

export const userRegistry = new UserRegistryService();
