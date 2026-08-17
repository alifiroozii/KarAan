import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import Redis from "ioredis";
import postgres from "postgres";

const productionFlag = process.argv.includes("--production");
const dev = !productionFlag && process.env.NODE_ENV !== "production";
if (!dev) process.env.NODE_ENV = "production";

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const REALTIME_REDIS_CHANNEL = "karaan:realtime:v1";
const realtimeInstanceId = process.env.REALTIME_INSTANCE_ID?.trim() || `socket-${process.pid}-${randomUUID()}`;
globalThis.__karaanRealtimeInstanceId = realtimeInstanceId;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const sql = postgres(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/karaan", {
  max: 5,
});
const realtimeSubscriber = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  connectTimeout: 5_000,
});

function readCookie(cookieHeader, key) {
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(";")) {
    const [name, ...valueParts] = item.trim().split("=");
    if (name === key) return decodeURIComponent(valueParts.join("="));
  }
  return null;
}

async function verifySession(token) {
  if (!token) return null;
  const rows = await sql`
    select s.user_id as "userId", u.role
    from sessions s
    inner join users u on u.id = s.user_id
    where s.token = ${token}
      and s.expires_at > now()
      and u.deleted_at is null
      and u.is_blocked = false
    limit 1
  `;
  return rows[0] || null;
}

async function canJoinAssignment(userId, assignmentId) {
  const rows = await sql`
    select
      a.worker_id as "workerId",
      s.employer_id as "employerId",
      exists(
        select 1 from business_members bm
        where bm.business_id = s.business_id and bm.user_id = ${userId}
      ) as "isBusinessMember",
      exists(
        select 1 from branches br
        where br.id = s.branch_id and br.manager_user_id = ${userId}
      ) as "isBranchManager"
    from shift_assignments a
    inner join shifts s on s.id = a.shift_id
    where a.id = ${assignmentId}
    limit 1
  `;
  const row = rows[0];
  return Boolean(row && (row.workerId === userId || row.employerId === userId || row.isBusinessMember || row.isBranchManager));
}

async function canJoinShift(userId, shiftId) {
  const rows = await sql`
    select
      s.employer_id as "employerId",
      exists(select 1 from shift_assignments a where a.shift_id = s.id and a.worker_id = ${userId}) as "isAssignedWorker",
      exists(select 1 from business_members bm where bm.business_id = s.business_id and bm.user_id = ${userId}) as "isBusinessMember",
      exists(select 1 from branches br where br.id = s.branch_id and br.manager_user_id = ${userId}) as "isBranchManager"
    from shifts s where s.id = ${shiftId} limit 1
  `;
  const row = rows[0];
  return Boolean(row && (row.employerId === userId || row.isAssignedWorker || row.isBusinessMember || row.isBranchManager));
}

async function canJoinBusiness(userId, businessId) {
  const rows = await sql`
    select 1 from businesses b
    inner join employer_profiles ep on ep.id = b.employer_profile_id
    where b.id = ${businessId}
      and (ep.user_id = ${userId} or exists(select 1 from business_members bm where bm.business_id = b.id and bm.user_id = ${userId}))
    limit 1
  `;
  return rows.length > 0;
}

async function canJoinBranch(userId, branchId) {
  const rows = await sql`
    select 1 from branches br
    inner join businesses b on b.id = br.business_id
    inner join employer_profiles ep on ep.id = b.employer_profile_id
    where br.id = ${branchId}
      and (br.manager_user_id = ${userId} or ep.user_id = ${userId} or exists(select 1 from business_members bm where bm.business_id = b.id and bm.user_id = ${userId}))
    limit 1
  `;
  return rows.length > 0;
}

async function authorizeRoom(user, roomType, id) {
  if (!id || !roomType) return false;
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;
  if (roomType === "user" || roomType === "worker") return user.userId === id;
  if (roomType === "assignment") return canJoinAssignment(user.userId, id);
  if (roomType === "shift") return canJoinShift(user.userId, id);
  if (roomType === "business") return canJoinBusiness(user.userId, id);
  if (roomType === "branch") return canJoinBranch(user.userId, id);
  return false;
}

function isValidDistributedEnvelope(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.sourceInstanceId === "string" &&
      typeof value.room === "string" &&
      /^(user|worker|assignment|shift|business|branch):[A-Za-z0-9_:-]{1,220}$/.test(value.room) &&
      typeof value.event === "string" &&
      /^[a-z_]+(?:\.[a-z_]+)+$/.test(value.event) &&
      value.payload &&
      typeof value.payload === "object" &&
      Number.isFinite(value.publishedAt)
  );
}

await app.prepare();

const httpServer = createServer((req, res) => handle(req, res));
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: { origin: false },
  transports: ["websocket", "polling"],
});

globalThis.__karaanSocketIO = io;

realtimeSubscriber.on("error", (error) => {
  console.error("[Realtime Redis Subscriber Error]", error.message);
});
realtimeSubscriber.on("message", (channel, raw) => {
  if (channel !== REALTIME_REDIS_CHANNEL) return;
  try {
    const envelope = JSON.parse(raw);
    if (!isValidDistributedEnvelope(envelope)) return;
    if (envelope.sourceInstanceId === realtimeInstanceId) return;
    io.to(envelope.room).emit(envelope.event, envelope.payload);
  } catch (error) {
    console.error("[Realtime Redis Message Error]", error);
  }
});

async function startRealtimeSubscriber() {
  if (realtimeSubscriber.status === "wait" || realtimeSubscriber.status === "end") {
    await realtimeSubscriber.connect();
  }
  await realtimeSubscriber.subscribe(REALTIME_REDIS_CHANNEL);
  console.log(`[Realtime] Redis subscriber ready as ${realtimeInstanceId}`);
}

if (dev) {
  try {
    await startRealtimeSubscriber();
  } catch (error) {
    console.warn("[Realtime] Redis subscriber unavailable in development", error);
  }
} else {
  await startRealtimeSubscriber();
}

io.use(async (socket, nextSocket) => {
  try {
    const cookieToken = readCookie(socket.handshake.headers.cookie, "karaan_session");
    const bearer = socket.handshake.auth?.token;
    const user = await verifySession(typeof bearer === "string" ? bearer : cookieToken);
    if (!user) return nextSocket(new Error("UNAUTHORIZED"));
    socket.data.user = user;
    socket.join(`user:${user.userId}`);
    if (user.role === "WORKER") socket.join(`worker:${user.userId}`);
    nextSocket();
  } catch (error) {
    console.error("[Socket Auth Error]", error);
    nextSocket(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  socket.on("room.join", async (payload, acknowledge) => {
    try {
      const roomType = String(payload?.type || "");
      const id = String(payload?.id || "");
      const allowed = await authorizeRoom(socket.data.user, roomType, id);
      if (!allowed) {
        acknowledge?.({ success: false, error: "FORBIDDEN" });
        return;
      }
      const room = `${roomType}:${id}`;
      await socket.join(room);
      acknowledge?.({ success: true, room });
    } catch (error) {
      console.error("[Socket Room Join Error]", error);
      acknowledge?.({ success: false, error: "ROOM_JOIN_FAILED" });
    }
  });
});

httpServer.listen(port, hostname, () => {
  console.log(`> KarAan ready on http://${hostname}:${port} (${dev ? "development" : "production"})`);
});

async function shutdown(signal) {
  console.log(`[${signal}] shutting down`);
  io.close();
  try {
    if (realtimeSubscriber.status !== "end") await realtimeSubscriber.quit();
  } catch (error) {
    console.error("[Realtime Redis Shutdown Error]", error);
  }
  httpServer.close(async () => {
    await sql.end({ timeout: 5 });
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
