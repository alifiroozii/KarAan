import crypto from "crypto";
import fs from "fs";
import path from "path";
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

export interface UserActivityEvent {
  id: string;
  action: string;
  title?: string;
  timestamp: string;
  details?: Record<string, any>;
  ipAddress?: string;
  gpsCoordinates?: { latitude: number; longitude: number };
}

export interface ProviderOfferedService {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  title: string;
  category: string;
  rate: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isAvailable: boolean;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
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
  offeredServices?: ProviderOfferedService[];
  notes?: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
    speed?: number;
    updatedAt: string;
  };
  activityTimeline?: UserActivityEvent[];
}

declare global {
  // eslint-disable-next-line no-var
  var __karaanUserRegistry: Map<string, RegisteredUser> | undefined;
  // eslint-disable-next-line no-var
  var __karaanRecentLogins: RegisteredUser[] | undefined;
  // eslint-disable-next-line no-var
  var __karaanDbTableInitialized: boolean | undefined;
  // eslint-disable-next-line no-var
  var __karaanLastCloudSync: number | undefined;
  // eslint-disable-next-line no-var
  var __karaanTelemetryLogs: Array<{
    id: string;
    userId: string | null;
    actorName: string;
    phone?: string;
    role?: string;
    action: string;
    entityName: string;
    entityId: string;
    details: Record<string, any>;
    ipAddress: string;
    timestamp: string;
  }> | undefined;
}

const CLOUD_SYNC_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a15b07dfaa33b8";

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
  createdAt: "2026-10-17T15:42:26.912Z",
  lastLoginAt: "2026-10-18T08:00:00.000Z",
  city: "تهران",
  notes: "دسترسی Super Admin به سامانه مانیتورینگ کاربران",
};

export const INITIAL_REAL_USERS: RegisteredUser[] = [
  MASTER_ADMIN,
];

const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "users-registry.json");
const TMP_DATA_PATH = "/tmp/karaan-users-registry.json";

function loadFromLocalDisk(): Map<string, RegisteredUser> | null {
  for (const fp of [LOCAL_DATA_PATH, TMP_DATA_PATH]) {
    try {
      if (fs.existsSync(fp)) {
        const raw = fs.readFileSync(fp, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, RegisteredUser>();
          for (const u of parsed) {
            if (u && u.id) map.set(u.id, u);
          }
          return map;
        }
      }
    } catch {}
  }
  return null;
}

function saveToLocalDisk(users: RegisteredUser[]): void {
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch {}

  try {
    fs.writeFileSync(TMP_DATA_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch {}
}

async function syncFromCloudStore(force = false): Promise<void> {
  const now = Date.now();
  const store = getMemoryStore();
  // Throttle cloud fetches to at most once every 60 seconds per instance, unless forced
  if (!force && globalThis.__karaanLastCloudSync && now - globalThis.__karaanLastCloudSync < 60000) {
    return;
  }
  globalThis.__karaanLastCloudSync = now;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch(CLOUD_SYNC_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return;

    const body = await res.json();
    let cloudUsers: RegisteredUser[] = [];
    if (body?.data?.payload && typeof body.data.payload === "string") {
      try {
        const decoded = Buffer.from(body.data.payload, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) cloudUsers = parsed;
      } catch {}
    } else if (Array.isArray(body?.data?.users)) {
      cloudUsers = body.data.users;
    }

    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      for (const cloudU of cloudUsers) {
        if (!cloudU || !cloudU.id) continue;
        const localU = store.get(cloudU.id);
        if (!localU) {
          store.set(cloudU.id, cloudU);
        } else {
          // Robust merge: Never wipe out requests! Merge unique by id
          const reqMap = new Map<string, UserSubmittedRequest>();
          for (const r of cloudU.submittedRequests || []) {
            if (r && r.id) reqMap.set(r.id, r);
          }
          for (const r of localU.submittedRequests || []) {
            if (r && r.id) reqMap.set(r.id, r);
          }
          const mergedRequests = Array.from(reqMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const localTime = new Date(localU.lastLoginAt || 0).getTime();
          const cloudTime = new Date(cloudU.lastLoginAt || 0).getTime();
          const fresher = localTime >= cloudTime ? localU : cloudU;

          store.set(cloudU.id, {
            ...cloudU,
            ...fresher,
            submittedRequests: mergedRequests,
          });
        }
      }
      globalThis.__karaanRecentLogins = Array.from(store.values())
        .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())
        .slice(0, 50);
      saveToLocalDisk(Array.from(store.values()));
    }
  } catch {
    // If cloud is unreachable, back off for 30 seconds to keep dashboard ultra-fast
    globalThis.__karaanLastCloudSync = Date.now() + 30000;
  }
}

async function pushToCloudStore(): Promise<void> {
  try {
    const store = getMemoryStore();
    const allUsers = Array.from(store.values());
    saveToLocalDisk(allUsers);

    const base64Payload = Buffer.from(JSON.stringify(allUsers), "utf-8").toString("base64");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    await fetch(CLOUD_SYNC_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        name: "karaan_production_registry",
        data: {
          payload: base64Payload,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
    clearTimeout(timeout);
  } catch {
    // Non-blocking fallback
  }
}

function getMemoryStore(): Map<string, RegisteredUser> {
  if (!globalThis.__karaanUserRegistry) {
    const fromDisk = loadFromLocalDisk();
    if (fromDisk && fromDisk.size > 0) {
      globalThis.__karaanUserRegistry = fromDisk;
      globalThis.__karaanRecentLogins = Array.from(fromDisk.values())
        .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())
        .slice(0, 50);
    } else {
      const initialMap = new Map<string, RegisteredUser>();
      for (const u of INITIAL_REAL_USERS) {
        initialMap.set(u.id, { ...u });
      }
      globalThis.__karaanUserRegistry = initialMap;
      globalThis.__karaanRecentLogins = INITIAL_REAL_USERS.map((u) => ({ ...u }));
      saveToLocalDisk(INITIAL_REAL_USERS);
    }
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

  let parsedServices: ProviderOfferedService[] = [];
  const srvData = row.offered_services ?? row.offeredServices;
  if (Array.isArray(srvData)) {
    parsedServices = srvData;
  } else if (typeof srvData === "string") {
    try {
      parsedServices = JSON.parse(srvData);
    } catch {
      parsedServices = [];
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
    offeredServices: parsedServices,
    notes: row.notes ? String(row.notes) : undefined,
    gpsCoordinates: row.gps_coordinates ?? row.gpsCoordinates,
    activityTimeline: Array.isArray(row.activity_timeline ?? row.activityTimeline)
      ? (row.activity_timeline ?? row.activityTimeline)
      : undefined,
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

      // Seed Real Mobile Users & Master Admin if completely empty
      const countRes = await sql`SELECT count(*)::int as count FROM registered_users;`;
      if ((countRes[0]?.count ?? 0) === 0) {
        for (const u of INITIAL_REAL_USERS) {
          await sql`
            INSERT INTO registered_users (
              id, full_name, email, phone, role, platform, device_model, app_version, ip_address, is_verified, is_blocked, provider, city, skills, submitted_requests, notes, created_at, last_login_at
            ) VALUES (
              ${u.id}, ${u.fullName}, ${u.email}, ${u.phone}, ${u.role}, ${u.platform}, ${u.deviceModel}, ${u.appVersion}, ${u.ipAddress}, ${u.isVerified}, ${u.isBlocked}, ${u.provider}, ${u.city ?? null}, ${JSON.stringify(u.skills || [])}::jsonb, ${JSON.stringify(u.submittedRequests || [])}::jsonb, ${u.notes ?? null}, ${u.createdAt}, ${u.lastLoginAt}
            ) ON CONFLICT (id) DO NOTHING;
          `;
        }
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
    await syncFromCloudStore();
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

    // Cloud persistent backup for multi-lambda Vercel synchronization
    await pushToCloudStore();

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
      // In-memory & Cloud persistent fallback
    }

    return { user: userResult, token };
  }

  /**
   * Register or log in a user with mobile phone credentials & telemetry (Zero OTP required).
   * Ensures that EVERY user action is immediately tied to a registered profile.
   */
  async registerOrLoginPhone(input: {
    phone: string;
    fullName?: string;
    role?: UserRole;
    platform?: "ANDROID" | "WEB" | "IOS";
    deviceModel?: string;
    appVersion?: string;
    ipAddress?: string;
    skills?: string[];
    city?: string;
    notes?: string;
  }): Promise<{ user: RegisteredUser; token: string }> {
    await syncFromCloudStore();
    const rawDigits = input.phone.replace(/\D/g, "");
    const cleanTail = rawDigits.slice(-10);
    const normalizedPhone = input.phone.trim();
    const platform = input.platform || "ANDROID";
    const store = getMemoryStore();

    let existingUser: RegisteredUser | undefined;
    for (const u of store.values()) {
      const uDigits = u.phone.replace(/\D/g, "");
      if (uDigits.slice(-10) === cleanTail) {
        existingUser = u;
        break;
      }
    }

    if (!existingUser) {
      try {
        await this.ensureDbTable();
        const rows = await sql`
          SELECT * FROM registered_users
          WHERE phone LIKE ${'%' + cleanTail}
          LIMIT 1;
        `;
        if (rows.length > 0) {
          existingUser = mapDbRowToRegisteredUser(rows[0]);
          store.set(existingUser.id, existingUser);
        }
      } catch {
        // In-memory fallback
      }
    }

    const nowIso = new Date().toISOString();
    let userResult: RegisteredUser;

    if (existingUser) {
      existingUser.lastLoginAt = nowIso;
      existingUser.platform = platform;
      if (input.fullName && input.fullName.trim() && (existingUser.fullName.startsWith("کاربر ") || !existingUser.fullName)) {
        existingUser.fullName = input.fullName.trim();
      }
      if (input.deviceModel) existingUser.deviceModel = input.deviceModel;
      if (input.appVersion) existingUser.appVersion = input.appVersion;
      if (input.ipAddress) existingUser.ipAddress = input.ipAddress;
      if (input.city) existingUser.city = input.city;
      if (input.role && !existingUser.role) existingUser.role = input.role;
      if (input.skills && input.skills.length > 0) {
        existingUser.skills = Array.from(new Set([...(existingUser.skills || []), ...input.skills]));
      }

      // Append login event to user's persistent dossier timeline
      if (!existingUser.activityTimeline) existingUser.activityTimeline = [];
      existingUser.activityTimeline.unshift({
        id: `act_${crypto.randomUUID().slice(0, 10)}`,
        action: "USER_LOGIN_PHONE",
        timestamp: nowIso,
        details: {
          role: existingUser.role,
          device: existingUser.deviceModel,
          event: "ورود مستقیم با شماره تلفن (کاربر از پیش ثبت‌شده در سامانه)",
        },
        ipAddress: input.ipAddress || existingUser.ipAddress,
      });

      store.set(existingUser.id, existingUser);
      userResult = existingUser;
    } else {
      const newUserId = `usr_${crypto.randomUUID()}`;
      const chosenRole: UserRole = input.role || "EMPLOYER";
      userResult = {
        id: newUserId,
        fullName: input.fullName?.trim() || `کاربر ${normalizedPhone}`,
        email: `${normalizedPhone}@karaan.ir`,
        phone: normalizedPhone,
        role: chosenRole,
        avatarUrl: null,
        platform,
        deviceModel: input.deviceModel || (platform === "ANDROID" ? "Android Device (Mobile App)" : "Web Browser"),
        appVersion: input.appVersion || "KARJOOR v2.5.0",
        ipAddress: input.ipAddress || "127.0.0.1",
        isVerified: true,
        isBlocked: false,
        provider: "PHONE_OTP",
        createdAt: nowIso,
        lastLoginAt: nowIso,
        city: input.city || "تهران",
        skills: input.skills || [],
        submittedRequests: [],
        offeredServices: [],
        activityTimeline: [
          {
            id: `act_${crypto.randomUUID().slice(0, 10)}`,
            action: "USER_REGISTER_PHONE",
            timestamp: nowIso,
            details: {
              role: chosenRole,
              event: "ثبت‌نام اولیه کاربر در سامانه کارجور",
            },
            ipAddress: input.ipAddress || "127.0.0.1",
          },
        ],
        notes: input.notes || "ثبت‌نام مستقیم با شماره موبایل",
      };
      store.set(newUserId, userResult);
    }

    const token = `karvin_${crypto.randomBytes(32).toString("hex")}`;
    await pushToCloudStore();

    return { user: userResult, token };
  }

  /**
   * Register an offered service by a provider/worker.
   */
  async registerProviderService(input: {
    providerId?: string;
    phone: string;
    fullName?: string;
    title: string;
    category: string;
    rate: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    details?: string;
  }): Promise<ProviderOfferedService> {
    await syncFromCloudStore();
    const cleanPhone = input.phone.trim();
    const cleanTail = cleanPhone.replace(/\D/g, "").slice(-10);

    const store = getMemoryStore();
    let targetUser: RegisteredUser | undefined;

    for (const u of store.values()) {
      const uTail = u.phone.replace(/\D/g, "").slice(-10);
      if (uTail === cleanTail || (input.providerId && u.id === input.providerId)) {
        targetUser = u;
        break;
      }
    }

    const nowIso = new Date().toISOString();

    if (!targetUser) {
      const newUserId = `usr_${crypto.randomUUID()}`;
      targetUser = {
        id: newUserId,
        fullName: input.fullName?.trim() || `متخصص ${cleanPhone}`,
        email: `${cleanPhone}@karaan.ir`,
        phone: cleanPhone,
        role: "WORKER",
        avatarUrl: null,
        platform: "ANDROID",
        deviceModel: "Android Mobile Device",
        appVersion: "KARJOOR v2.5.0",
        ipAddress: "127.0.0.1",
        isVerified: true,
        isBlocked: false,
        provider: "PHONE_OTP",
        createdAt: nowIso,
        lastLoginAt: nowIso,
        city: input.city || "تهران",
        skills: [input.category],
        submittedRequests: [],
        offeredServices: [],
        activityTimeline: [],
      };
      store.set(newUserId, targetUser);
    } else {
      targetUser.role = "WORKER";
      if (input.fullName && input.fullName.trim() && targetUser.fullName.startsWith("کاربر ")) {
        targetUser.fullName = input.fullName.trim();
      }
      targetUser.lastLoginAt = nowIso;
    }

    const newService: ProviderOfferedService = {
      id: `srv_${crypto.randomUUID().slice(0, 8)}`,
      providerId: targetUser.id,
      providerName: targetUser.fullName,
      providerPhone: targetUser.phone,
      title: input.title,
      category: input.category,
      rate: input.rate || "توافقی",
      city: input.city || targetUser.city || "تهران",
      address: input.address,
      latitude: input.latitude || 35.7005,
      longitude: input.longitude || 51.3915,
      isAvailable: true,
      createdAt: nowIso,
      rating: 5.0,
      reviewCount: 1,
      details: input.details,
    };

    if (!targetUser.offeredServices) targetUser.offeredServices = [];
    targetUser.offeredServices.unshift(newService);

    if (!targetUser.skills) targetUser.skills = [];
    if (!targetUser.skills.includes(input.category)) {
      targetUser.skills.push(input.category);
    }

    if (!targetUser.activityTimeline) targetUser.activityTimeline = [];
    targetUser.activityTimeline.unshift({
      id: `act_${crypto.randomUUID().slice(0, 10)}`,
      action: "PROVIDER_SERVICE_OFFERED",
      timestamp: nowIso,
      details: {
        serviceId: newService.id,
        title: newService.title,
        category: newService.category,
        rate: newService.rate,
        city: newService.city,
        address: newService.address,
      },
      ipAddress: targetUser.ipAddress,
      gpsCoordinates: input.latitude && input.longitude ? { latitude: input.latitude, longitude: input.longitude } : undefined,
    });

    store.set(targetUser.id, targetUser);

    await this.recordTelemetryLog({
      userId: targetUser.id,
      actorName: targetUser.fullName,
      phone: targetUser.phone,
      role: "WORKER",
      action: "PROVIDER_SERVICE_OFFERED",
      entityName: "provider_service",
      entityId: newService.id,
      details: {
        title: newService.title,
        category: newService.category,
        rate: newService.rate,
        city: newService.city,
      },
    });

    try {
      await this.ensureDbTable();
      await sql`
        UPDATE registered_users
        SET offered_services = ${JSON.stringify(targetUser.offeredServices)}::jsonb,
            skills = ${JSON.stringify(targetUser.skills)}::jsonb,
            activity_timeline = ${JSON.stringify(targetUser.activityTimeline)}::jsonb,
            last_login_at = ${targetUser.lastLoginAt}
        WHERE id = ${targetUser.id};
      `;
    } catch {
      // In-memory fallback
    }

    await pushToCloudStore();
    return newService;
  }

  /**
   * Get all active offered services by providers for Requester Map and List.
   */
  async getAllOfferedServices(): Promise<ProviderOfferedService[]> {
    await syncFromCloudStore();
    const store = getMemoryStore();
    const list: ProviderOfferedService[] = [];

    for (const u of store.values()) {
      if (u.offeredServices && u.offeredServices.length > 0) {
        for (const s of u.offeredServices) {
          if (s.isAvailable !== false) {
            list.push({
              ...s,
              providerName: u.fullName,
              providerPhone: u.phone,
              latitude: s.latitude || u.gpsCoordinates?.lat || 35.7005,
              longitude: s.longitude || u.gpsCoordinates?.lng || 51.3915,
            });
          }
        }
      }
    }
    return list;
  }

  /**
   * Record a live telemetry event from mobile app into in-memory & cloud audit store.
   */
  async recordTelemetryLog(entry: {
    userId?: string | null;
    actorName: string;
    phone?: string;
    role?: string;
    action: string;
    entityName?: string;
    entityId?: string;
    details: Record<string, any>;
    ipAddress?: string;
  }) {
    if (!globalThis.__karaanTelemetryLogs) {
      globalThis.__karaanTelemetryLogs = [];
    }
    const logItem = {
      id: `aud_${crypto.randomUUID().slice(0, 16)}`,
      userId: entry.userId || null,
      actorName: entry.actorName,
      phone: entry.phone,
      role: entry.role,
      action: entry.action,
      entityName: entry.entityName || "mobile_app",
      entityId: entry.entityId || entry.phone || "anonymous_device",
      details: entry.details,
      ipAddress: entry.ipAddress || "127.0.0.1",
      timestamp: new Date().toISOString(),
    };
    globalThis.__karaanTelemetryLogs.unshift(logItem);
    if (globalThis.__karaanTelemetryLogs.length > 300) {
      globalThis.__karaanTelemetryLogs.pop();
    }

    // Attach to user dossier if phone is known
    if (entry.phone) {
      const cleanPhone = entry.phone.trim().replace(/\D/g, "");
      const searchTail = cleanPhone.slice(-10);
      const store = getMemoryStore();
      for (const u of store.values()) {
        const uDigits = u.phone.replace(/\D/g, "");
        if (uDigits.endsWith(searchTail) || cleanPhone === uDigits) {
          if (!u.activityTimeline) u.activityTimeline = [];
          u.activityTimeline.unshift({
            id: logItem.id,
            action: logItem.action,
            title: entry.details?.event || logItem.action,
            timestamp: logItem.timestamp,
            details: logItem.details,
            ipAddress: logItem.ipAddress,
          });
          if (u.activityTimeline.length > 100) u.activityTimeline.pop();

          if (typeof entry.details?.lat === "number" && typeof entry.details?.lng === "number") {
            u.gpsCoordinates = {
              lat: entry.details.lat,
              lng: entry.details.lng,
              speed: typeof entry.details?.speed === "number" ? entry.details.speed : undefined,
              updatedAt: logItem.timestamp,
            };
          }
          u.lastLoginAt = logItem.timestamp;
          store.set(u.id, u);
          break;
        }
      }
    }

    return logItem;
  }

  /**
   * Get all live telemetry audit logs from memory.
   */
  getTelemetryLogs() {
    return globalThis.__karaanTelemetryLogs || [];
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

    await pushToCloudStore();
    return newReq;
  }

  /**
   * Find a user by ID, email, or phone.
   */
  async findUser(query: { id?: string; email?: string; phone?: string }): Promise<RegisteredUser | null> {
    await syncFromCloudStore();
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

    await pushToCloudStore();
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
    await pushToCloudStore();
    return user || null;
  }

  /**
   * Get single user by ID with deep telemetry.
   */
  async getUserById(id: string): Promise<RegisteredUser | null> {
    await syncFromCloudStore();
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
    await syncFromCloudStore();
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
    await syncFromCloudStore();
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
    await pushToCloudStore();
    return user || null;
  }

  async resetToMasterAdminOnly(): Promise<void> {
    const store = getMemoryStore();
    store.clear();
    store.set(MASTER_ADMIN.id, { ...MASTER_ADMIN });
    globalThis.__karaanRecentLogins = [{ ...MASTER_ADMIN }];

    try {
      await this.ensureDbTable();
      await sql`DELETE FROM registered_users WHERE id != ${MASTER_ADMIN.id};`.catch(() => {});
    } catch {
      // Resilient fallback
    }
    await pushToCloudStore();
  }

  /**
   * Purge all old legacy and test data from memory, local disk, database and cloud.
   */
  async purgeAllData(): Promise<{ success: boolean; purgedAt: string }> {
    const store = getMemoryStore();
    store.clear();
    globalThis.__karaanRecentLogins = [];
    globalThis.__karaanTelemetryLogs = [];

    // Clear disk files
    try {
      if (fs.existsSync(LOCAL_DATA_PATH)) fs.writeFileSync(LOCAL_DATA_PATH, "[]", "utf-8");
      if (fs.existsSync(TMP_DATA_PATH)) fs.writeFileSync(TMP_DATA_PATH, "[]", "utf-8");
    } catch {}

    // Clear Postgres table if accessible
    try {
      await this.ensureDbTable();
      await sql`TRUNCATE TABLE registered_users CASCADE;`.catch(() => {});
    } catch {}

    // Clear remote cloud store
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      await fetch(CLOUD_SYNC_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: "karaan_production_registry",
          data: {
            payload: Buffer.from("[]", "utf-8").toString("base64"),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
      clearTimeout(timeout);
    } catch {}

    return { success: true, purgedAt: new Date().toISOString() };
  }

  /**
   * Get full user dossier by phone number with all associated telemetry logs & requests.
   */
  async getUserDossierByPhone(rawPhone: string) {
    await syncFromCloudStore();
    const cleanDigits = rawPhone.replace(/\D/g, "");
    if (!cleanDigits) return null;
    const searchTail = cleanDigits.slice(-10);

    const store = getMemoryStore();
    let user: RegisteredUser | null = null;

    for (const u of store.values()) {
      const uDigits = u.phone.replace(/\D/g, "");
      if (uDigits.endsWith(searchTail) || cleanDigits === uDigits) {
        user = u;
        break;
      }
    }

    if (!user) {
      try {
        await this.ensureDbTable();
        const rows = await sql`SELECT * FROM registered_users WHERE phone LIKE ${"%" + searchTail} LIMIT 1;`;
        if (rows.length > 0) {
          user = mapDbRowToRegisteredUser(rows[0]);
        }
      } catch {}
    }

    if (!user) return null;

    // Gather all audit/telemetry logs matching this user's phone or id
    const allTelemetry = this.getTelemetryLogs();
    const userLogs = allTelemetry.filter((l) => {
      const lDigits = (l.phone || "").replace(/\D/g, "");
      return (
        (lDigits && lDigits.endsWith(searchTail)) ||
        l.userId === user?.id ||
        (l.details?.phone && String(l.details.phone).replace(/\D/g, "").endsWith(searchTail))
      );
    });

    const timeline = user.activityTimeline || [];
    const combinedLogMap = new Map<string, any>();
    for (const l of userLogs) combinedLogMap.set(l.id, l);
    for (const t of timeline) {
      if (!combinedLogMap.has(t.id)) {
        combinedLogMap.set(t.id, {
          id: t.id,
          action: t.action,
          actorName: user.fullName,
          phone: user.phone,
          role: user.role,
          entityName: "user_timeline",
          entityId: user.id,
          details: t.details || {},
          ipAddress: t.ipAddress || user.ipAddress,
          timestamp: t.timestamp,
        });
      }
    }

    const sortedLogs = Array.from(combinedLogMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      user,
      logs: sortedLogs,
      totalLogsCount: sortedLogs.length,
      requestsCount: user.submittedRequests?.length || 0,
      servicesCount: user.offeredServices?.length || 0,
      offeredServices: user.offeredServices || [],
      roleCategory: user.role === "EMPLOYER" || (user.role as any) === "REQUESTER" ? "REQUESTER" : "PROVIDER",
      latestGps: user.gpsCoordinates || null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get comprehensive multi-dimensional reports for Vercel Executive Dashboard.
   */
  async getComprehensiveReports() {
    await syncFromCloudStore();
    const store = getMemoryStore();
    const all = Array.from(store.values());
    const allLogs = this.getTelemetryLogs();

    const totalUsers = all.length;
    const requesters = all.filter((u) => u.role === "EMPLOYER" || (u as any).role === "REQUESTER");
    const providers = all.filter((u) => u.role === "WORKER" || (u as any).role === "PROVIDER");
    const androidUsers = all.filter((u) => u.platform === "ANDROID");
    const webUsers = all.filter((u) => u.platform === "WEB");

    const allRequests: UserSubmittedRequest[] = [];
    for (const u of all) {
      if (u.submittedRequests) {
        allRequests.push(...u.submittedRequests);
      }
    }

    const requestStatuses = {
      active: allRequests.filter((r) => r.status === "ACTIVE").length,
      approved: allRequests.filter((r) => r.status === "APPROVED" || r.status === "ACCEPTED").length,
      inProgress: allRequests.filter((r) => r.status === "IN_PROGRESS").length,
      completed: allRequests.filter((r) => r.status === "COMPLETED").length,
      cancelled: allRequests.filter((r) => r.status === "CANCELLED").length,
      total: allRequests.length,
    };

    const deviceMap = new Map<string, number>();
    for (const u of all) {
      const model = u.deviceModel || "Android Device";
      deviceMap.set(model, (deviceMap.get(model) || 0) + 1);
    }
    const topDevices = Array.from(deviceMap.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const cityMap = new Map<string, number>();
    for (const u of all) {
      const city = u.city || "تهران";
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    }
    const topCities = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const dailyActivityMap = new Map<string, { logins: number; requests: number; telemetry: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      dailyActivityMap.set(d, { logins: 0, requests: 0, telemetry: 0 });
    }

    for (const l of allLogs) {
      const d = l.timestamp?.split("T")[0];
      if (d && dailyActivityMap.has(d)) {
        dailyActivityMap.get(d)!.telemetry++;
        if (l.action?.includes("LOGIN")) dailyActivityMap.get(d)!.logins++;
      }
    }
    for (const r of allRequests) {
      const d = r.createdAt?.split("T")[0];
      if (d && dailyActivityMap.has(d)) {
        dailyActivityMap.get(d)!.requests++;
      }
    }

    return {
      summary: {
        totalUsers,
        requestersCount: requesters.length,
        providersCount: providers.length,
        androidUsersCount: androidUsers.length,
        webUsersCount: webUsers.length,
        totalRequestsCount: allRequests.length,
        activeRequestsCount: requestStatuses.active + requestStatuses.approved + requestStatuses.inProgress,
        completedRequestsCount: requestStatuses.completed,
        totalTelemetryLogs: allLogs.length,
      },
      requestStatuses,
      topDevices,
      topCities,
      dailyTrends: Array.from(dailyActivityMap.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}

export const userRegistry = new UserRegistryService();
