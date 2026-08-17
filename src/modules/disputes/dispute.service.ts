import crypto from "crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, branches, businessMembers, disputes, shiftAssignments, shifts, timesheets } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";
import { hasPermission } from "@/modules/auth/permissions";
import { NotificationService } from "@/modules/notifications/notification.service";

export type DisputeResolutionAction = "REQUIRE_ADJUSTMENT" | "REJECT_DISPUTE";

type Context = {
  assignmentId: string;
  workerId: string;
  shiftId: string;
  employerId: string;
  businessId: string | null;
  branchId: string | null;
  timesheetId: string;
  timesheetStatus: typeof timesheets.$inferSelect.status;
};

type AccessContext = Pick<Context, "workerId" | "employerId" | "businessId" | "branchId">;

const notificationsService = new NotificationService();

function decodeReason(reason: string) {
  const [reasonCode, ...rest] = reason.split("\n");
  return { reasonCode, description: rest.join("\n") || reasonCode };
}

export class DisputeService {
  private async loadTimesheetContext(timesheetId: string): Promise<Context> {
    const [row] = await db
      .select({
        assignmentId: shiftAssignments.id,
        workerId: shiftAssignments.workerId,
        shiftId: shifts.id,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
        timesheetId: timesheets.id,
        timesheetStatus: timesheets.status,
      })
      .from(timesheets)
      .innerJoin(shiftAssignments, eq(timesheets.assignmentId, shiftAssignments.id))
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(eq(timesheets.id, timesheetId))
      .limit(1);
    if (!row) throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  private async canAccess(context: AccessContext, actorUserId: string, role: UserRole) {
    if (["ADMIN", "SUPER_ADMIN", "DISPUTE_AGENT", "SUPPORT_AGENT"].includes(role)) return true;
    if (context.workerId === actorUserId || context.employerId === actorUserId) return true;
    if (context.branchId) {
      const [managed] = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.id, context.branchId), eq(branches.managerUserId, actorUserId))).limit(1);
      if (managed) return true;
    }
    if (context.businessId) {
      const [member] = await db.select({ id: businessMembers.id }).from(businessMembers).where(and(eq(businessMembers.businessId, context.businessId), eq(businessMembers.userId, actorUserId))).limit(1);
      if (member) return true;
    }
    return false;
  }

  private async notify(userId: string, disputeId: string, title: string, body: string, suffix: string) {
    try {
      await notificationsService.createNotification({
        userId,
        type: "SYSTEM_ANNOUNCEMENT",
        title,
        body,
        data: { subtype: "DISPUTE", disputeId },
        idempotencyKey: `dispute:${disputeId}:${suffix}:${userId}`,
        channels: ["SMS"],
      });
    } catch (error) {
      console.error("[Dispute Notification Error]", { disputeId, userId, message: error instanceof Error ? error.message : "unknown" });
    }
  }

  async openFromTimesheet(timesheetId: string, actorUserId: string, role: UserRole, reasonCode: string, description: string) {
    const context = await this.loadTimesheetContext(timesheetId);
    if (!(await this.canAccess(context, actorUserId, role)) || !hasPermission(role, "dispute.create")) {
      throw new AppError("دسترسی به ثبت اختلاف برای این تایم‌شیت مجاز نیست.", "FORBIDDEN", 403);
    }
    if (["READY_FOR_SETTLEMENT", "SETTLED", "VOID"].includes(context.timesheetStatus)) {
      throw new AppError("این تایم‌شیت در این مرحله قابل اختلاف نیست.", "CONFLICT", 409);
    }

    let disputeId = "";
    let created = false;
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`dispute:${context.assignmentId}`}))`);
      const [existing] = await tx.select().from(disputes).where(and(eq(disputes.assignmentId, context.assignmentId), or(eq(disputes.status, "OPEN"), eq(disputes.status, "UNDER_REVIEW")))).limit(1);
      if (existing) {
        disputeId = existing.id;
        return;
      }

      const [currentTimesheet] = await tx.select({ status: timesheets.status }).from(timesheets).where(eq(timesheets.id, timesheetId)).limit(1);
      if (!currentTimesheet) throw new AppError("تایم‌شیت پیدا نشد.", "NOT_FOUND", 404);
      if (["READY_FOR_SETTLEMENT", "SETTLED", "VOID"].includes(currentTimesheet.status)) throw new AppError("تایم‌شیت وارد مرحله مالی شده و قابل اختلاف نیست.", "CONFLICT", 409);

      disputeId = `dsp_${crypto.randomUUID()}`;
      const now = new Date();
      await tx.insert(disputes).values({ id: disputeId, assignmentId: context.assignmentId, raisedByUserId: actorUserId, reason: `${reasonCode.trim()}\n${description.trim()}`, status: "OPEN", createdAt: now, updatedAt: now });
      await tx.update(timesheets).set({ status: "DISPUTED", updatedAt: now }).where(eq(timesheets.id, timesheetId));
      await tx.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actorUserId, entityName: "dispute", entityId: disputeId, action: "DISPUTE_OPENED", details: { assignmentId: context.assignmentId, timesheetId, previousTimesheetStatus: currentTimesheet.status, reasonCode } });
      created = true;
    });

    if (created) {
      publishRealtimeEvent("assignment", context.assignmentId, "dispute.updated", { disputeId, status: "OPEN" });
      publishRealtimeEvent("user", context.workerId, "dispute.updated", { disputeId, status: "OPEN" });
      publishRealtimeEvent("user", context.employerId, "dispute.updated", { disputeId, status: "OPEN" });
      const counterpart = actorUserId === context.workerId ? context.employerId : context.workerId;
      await this.notify(counterpart, disputeId, "اختلاف جدید ثبت شد", "برای یکی از تایم‌شیت‌های مرتبط با شما پرونده اختلاف ایجاد شده است.", "opened");
    }
    return { ...(await this.getForActor(disputeId, actorUserId, role)), idempotent: !created };
  }

  async listForActor(actorUserId: string, role: UserRole) {
    const rows = await db
      .select({
        dispute: disputes,
        workerId: shiftAssignments.workerId,
        shiftId: shifts.id,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
        shiftTitle: shifts.title,
        timesheetId: timesheets.id,
        timesheetStatus: timesheets.status,
      })
      .from(disputes)
      .innerJoin(shiftAssignments, eq(disputes.assignmentId, shiftAssignments.id))
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .innerJoin(timesheets, eq(timesheets.assignmentId, shiftAssignments.id))
      .orderBy(desc(disputes.createdAt))
      .limit(100);

    const items = [];
    for (const row of rows) {
      if (!(await this.canAccess(row, actorUserId, role))) continue;
      const reason = decodeReason(row.dispute.reason);
      items.push({
        id: row.dispute.id,
        assignmentId: row.dispute.assignmentId,
        timesheetId: row.timesheetId,
        shiftId: row.shiftId,
        shiftTitle: row.shiftTitle,
        raisedByUserId: row.dispute.raisedByUserId,
        reasonCode: reason.reasonCode,
        description: reason.description,
        status: row.dispute.status,
        timesheetStatus: row.timesheetStatus,
        resolutionNotes: row.dispute.resolutionNotes,
        resolvedByUserId: row.dispute.resolvedByUserId,
        createdAt: row.dispute.createdAt.toISOString(),
        updatedAt: row.dispute.updatedAt.toISOString(),
      });
    }
    return { items, canManage: hasPermission(role, "dispute.manage") };
  }

  async getForActor(disputeId: string, actorUserId: string, role: UserRole) {
    const page = await this.listForActor(actorUserId, role);
    const item = page.items.find((row) => row.id === disputeId);
    if (!item) throw new AppError("پرونده اختلاف پیدا نشد یا دسترسی ندارید.", "NOT_FOUND", 404);
    return { ...item, canManage: page.canManage };
  }

  async startReview(disputeId: string, actorUserId: string, role: UserRole) {
    if (!hasPermission(role, "dispute.manage")) throw new AppError("مجوز بررسی اختلاف را ندارید.", "FORBIDDEN", 403);
    const current = await this.getForActor(disputeId, actorUserId, role);
    if (current.status === "UNDER_REVIEW") return { ...current, idempotent: true };
    if (current.status !== "OPEN") throw new AppError("این پرونده دیگر قابل ورود به بررسی نیست.", "CONFLICT", 409);

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`dispute-review:${disputeId}`}))`);
      const [row] = await tx.select({ status: disputes.status }).from(disputes).where(eq(disputes.id, disputeId)).limit(1);
      if (!row) throw new AppError("پرونده اختلاف پیدا نشد.", "NOT_FOUND", 404);
      if (row.status === "UNDER_REVIEW") return;
      if (row.status !== "OPEN") throw new AppError("وضعیت پرونده قابل بررسی نیست.", "CONFLICT", 409);
      await tx.update(disputes).set({ status: "UNDER_REVIEW", updatedAt: now }).where(eq(disputes.id, disputeId));
      await tx.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actorUserId, entityName: "dispute", entityId: disputeId, action: "DISPUTE_REVIEW_STARTED", details: {} });
    });
    publishRealtimeEvent("assignment", current.assignmentId, "dispute.updated", { disputeId, status: "UNDER_REVIEW" });
    await this.notify(current.raisedByUserId, disputeId, "بررسی اختلاف شروع شد", "پرونده شما توسط واحد حل اختلاف در حال بررسی است.", "review");
    return this.getForActor(disputeId, actorUserId, role);
  }

  async resolve(disputeId: string, actorUserId: string, role: UserRole, action: DisputeResolutionAction, notes: string) {
    if (!hasPermission(role, "dispute.manage")) throw new AppError("مجوز صدور رأی اختلاف را ندارید.", "FORBIDDEN", 403);
    const current = await this.getForActor(disputeId, actorUserId, role);
    if (current.status === "RESOLVED" || current.status === "REJECTED") return { ...current, idempotent: true };
    if (current.status !== "OPEN" && current.status !== "UNDER_REVIEW") throw new AppError("این پرونده قابل رأی نیست.", "CONFLICT", 409);

    const disputeStatus = action === "REQUIRE_ADJUSTMENT" ? "RESOLVED" : "REJECTED";
    const nextTimesheetStatus = action === "REQUIRE_ADJUSTMENT" ? "ADJUSTMENT_REQUIRED" : "SUBMITTED";
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`dispute-resolve:${disputeId}`}))`);
      const [row] = await tx.select({ status: disputes.status }).from(disputes).where(eq(disputes.id, disputeId)).limit(1);
      if (!row) throw new AppError("پرونده اختلاف پیدا نشد.", "NOT_FOUND", 404);
      if (row.status === "RESOLVED" || row.status === "REJECTED") return;
      await tx.update(disputes).set({ status: disputeStatus, resolutionNotes: notes.trim(), resolvedByUserId: actorUserId, updatedAt: now }).where(eq(disputes.id, disputeId));
      await tx.update(timesheets).set({ status: nextTimesheetStatus, approvedAt: null, approvedByUserId: null, readyForSettlementAt: null, updatedAt: now }).where(eq(timesheets.id, current.timesheetId));
      await tx.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actorUserId, entityName: "dispute", entityId: disputeId, action: "DISPUTE_RESOLVED", details: { action, disputeStatus, nextTimesheetStatus, notes: notes.trim() } });
    });

    publishRealtimeEvent("assignment", current.assignmentId, "dispute.updated", { disputeId, status: disputeStatus, resolutionAction: action });
    await this.notify(current.raisedByUserId, disputeId, "رأی اختلاف صادر شد", action === "REQUIRE_ADJUSTMENT" ? "اختلاف پذیرفته شد و تایم‌شیت برای اصلاح بازگشت." : "اختلاف رد شد و تایم‌شیت به مسیر عادی بازگشت.", `resolved:${action}`);
    return this.getForActor(disputeId, actorUserId, role);
  }
}
