import crypto from "crypto";
import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  branches,
  businessMembers,
  conversations,
  messages,
  shiftAssignments,
  shifts,
  users,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime/socket-server";
import type { UserRole } from "@/modules/auth/auth.service";
import { hasPermission } from "@/modules/auth/permissions";
import { NotificationService } from "@/modules/notifications/notification.service";

const CHAT_SEND_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_MESSAGES_PER_MINUTE = 20;
const CLOSED_FOR_CHAT_STATES = new Set(["OFFERED", "VIEWED", "DECLINED", "REMOVED"]);
const notifications = new NotificationService();

type AssignmentContext = {
  assignmentId: string;
  assignmentState: typeof shiftAssignments.$inferSelect.state;
  workerId: string;
  shiftId: string;
  shiftTitle: string;
  shiftEndAt: Date;
  employerId: string;
  businessId: string | null;
  branchId: string | null;
  workerName: string;
};

type ConversationContext = AssignmentContext & {
  conversationId: string;
  conversationCreatedAt: Date;
};

function deterministicId(prefix: string, value: string) {
  return `${prefix}_${crypto.createHash("sha256").update(value).digest("hex").slice(0, 32)}`;
}

export class MessagingService {
  private async loadAssignmentContext(assignmentId: string): Promise<AssignmentContext> {
    const [row] = await db
      .select({
        assignmentId: shiftAssignments.id,
        assignmentState: shiftAssignments.state,
        workerId: shiftAssignments.workerId,
        shiftId: shifts.id,
        shiftTitle: shifts.title,
        shiftEndAt: shifts.endAt,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
        workerName: users.fullName,
      })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    if (!row) throw new AppError("Assignment پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  private async loadConversationContext(conversationId: string): Promise<ConversationContext> {
    const [row] = await db
      .select({
        conversationId: conversations.id,
        conversationCreatedAt: conversations.createdAt,
        assignmentId: shiftAssignments.id,
        assignmentState: shiftAssignments.state,
        workerId: shiftAssignments.workerId,
        shiftId: shifts.id,
        shiftTitle: shifts.title,
        shiftEndAt: shifts.endAt,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
        workerName: users.fullName,
      })
      .from(conversations)
      .innerJoin(shiftAssignments, eq(conversations.assignmentId, shiftAssignments.id))
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!row) throw new AppError("گفتگو پیدا نشد.", "NOT_FOUND", 404);
    return row;
  }

  private async hasObjectAccess(context: AssignmentContext, actorUserId: string, role: UserRole) {
    if (["ADMIN", "SUPER_ADMIN", "SUPPORT_AGENT"].includes(role)) return true;
    if (context.workerId === actorUserId || context.employerId === actorUserId) return true;

    if (context.branchId) {
      const [managedBranch] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, context.branchId), eq(branches.managerUserId, actorUserId)))
        .limit(1);
      if (managedBranch) return true;
    }

    if (context.businessId) {
      const [member] = await db
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, context.businessId),
            eq(businessMembers.userId, actorUserId)
          )
        )
        .limit(1);
      if (member) return true;
    }
    return false;
  }

  private assertSendWindow(context: AssignmentContext) {
    if (CLOSED_FOR_CHAT_STATES.has(context.assignmentState)) {
      throw new AppError("برای این Assignment امکان ارسال پیام فعال نیست.", "CONFLICT", 409);
    }
    if (Date.now() > context.shiftEndAt.getTime() + CHAT_SEND_GRACE_MS) {
      throw new AppError(
        "مهلت ارسال پیام این شیفت پایان یافته است؛ تاریخچه گفتگو همچنان قابل مشاهده است.",
        "CONFLICT",
        409
      );
    }
  }

  private async assertReadable(context: AssignmentContext, actorUserId: string, role: UserRole) {
    if (!hasPermission(role, "message.view") || !(await this.hasObjectAccess(context, actorUserId, role))) {
      throw new AppError("به این گفتگو دسترسی ندارید.", "FORBIDDEN", 403);
    }
  }

  private async assertSendable(context: AssignmentContext, actorUserId: string, role: UserRole) {
    if (!hasPermission(role, "message.send") || !(await this.hasObjectAccess(context, actorUserId, role))) {
      throw new AppError("مجوز ارسال پیام در این گفتگو را ندارید.", "FORBIDDEN", 403);
    }
    this.assertSendWindow(context);
  }

  async ensureAssignmentConversation(assignmentId: string, actorUserId: string, role: UserRole) {
    const context = await this.loadAssignmentContext(assignmentId);
    await this.assertSendable(context, actorUserId, role);
    const deterministicConversationId = deterministicId("cnv", assignmentId);
    let created = false;

    const conversation = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`conversation:${assignmentId}`}))`);
      const [existing] = await tx.select().from(conversations).where(eq(conversations.assignmentId, assignmentId)).limit(1);
      if (existing) return existing;

      const now = new Date();
      const [inserted] = await tx
        .insert(conversations)
        .values({ id: deterministicConversationId, assignmentId, shiftId: context.shiftId, createdAt: now })
        .onConflictDoNothing()
        .returning();

      const [resolved] = inserted
        ? [inserted]
        : await tx.select().from(conversations).where(eq(conversations.assignmentId, assignmentId)).limit(1);
      if (!resolved) {
        throw new AppError("ایجاد گفتگو انجام نشد.", "INTERNAL_SERVER_ERROR", 500);
      }

      if (inserted) {
        created = true;
        await tx.insert(auditLogs).values({
          id: `aud_${crypto.randomUUID()}`,
          actorId: actorUserId,
          entityName: "conversation",
          entityId: resolved.id,
          action: "CONVERSATION_CREATED",
          details: { assignmentId, shiftId: context.shiftId },
        });
      }
      return resolved;
    });

    return {
      id: conversation.id,
      assignmentId: context.assignmentId,
      shiftId: context.shiftId,
      shiftTitle: context.shiftTitle,
      workerName: context.workerName,
      createdAt: conversation.createdAt.toISOString(),
      idempotent: !created,
    };
  }

  async listConversations(actorUserId: string, role: UserRole) {
    if (!hasPermission(role, "message.view")) {
      throw new AppError("مجوز مشاهده گفتگوها را ندارید.", "FORBIDDEN", 403);
    }

    const rows = await db
      .select({
        conversationId: conversations.id,
        conversationCreatedAt: conversations.createdAt,
        assignmentId: shiftAssignments.id,
        assignmentState: shiftAssignments.state,
        workerId: shiftAssignments.workerId,
        shiftId: shifts.id,
        shiftTitle: shifts.title,
        shiftEndAt: shifts.endAt,
        employerId: shifts.employerId,
        businessId: shifts.businessId,
        branchId: shifts.branchId,
        workerName: users.fullName,
      })
      .from(conversations)
      .innerJoin(shiftAssignments, eq(conversations.assignmentId, shiftAssignments.id))
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .innerJoin(users, eq(users.id, shiftAssignments.workerId))
      .orderBy(desc(conversations.createdAt))
      .limit(100);

    const accessible: ConversationContext[] = [];
    for (const row of rows) {
      if (await this.hasObjectAccess(row, actorUserId, role)) accessible.push(row);
    }
    if (accessible.length === 0) return { items: [] };

    const ids = accessible.map((row) => row.conversationId);
    const activitySummaries = await db
      .select({
        conversationId: messages.conversationId,
        lastMessageAt: sql<string | null>`max(${messages.createdAt})::text`,
      })
      .from(messages)
      .where(inArray(messages.conversationId, ids))
      .groupBy(messages.conversationId);

    const unreadSummaries = await db
      .select({ conversationId: messages.conversationId, unreadCount: count(messages.id) })
      .from(messages)
      .where(
        and(
          inArray(messages.conversationId, ids),
          ne(messages.senderId, actorUserId),
          isNull(messages.readAt)
        )
      )
      .groupBy(messages.conversationId);

    const activityByConversation = new Map(
      activitySummaries.map((summary) => [summary.conversationId, summary.lastMessageAt])
    );
    const unreadByConversation = new Map(
      unreadSummaries.map((summary) => [summary.conversationId, summary.unreadCount])
    );

    const items = accessible.map((row) => ({
      id: row.conversationId,
      assignmentId: row.assignmentId,
      assignmentState: row.assignmentState,
      shiftId: row.shiftId,
      shiftTitle: row.shiftTitle,
      workerName: row.workerName,
      counterpartLabel: row.workerId === actorUserId ? "کارفرما" : row.workerName,
      canSend:
        hasPermission(role, "message.send") &&
        !CLOSED_FOR_CHAT_STATES.has(row.assignmentState) &&
        Date.now() <= row.shiftEndAt.getTime() + CHAT_SEND_GRACE_MS,
      unreadCount: unreadByConversation.get(row.conversationId) ?? 0,
      lastMessageAt: activityByConversation.get(row.conversationId) ?? null,
      createdAt: row.conversationCreatedAt.toISOString(),
    }));

    items.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    return { items };
  }

  async listMessages(
    conversationId: string,
    actorUserId: string,
    role: UserRole,
    cursor?: string | null,
    limit = 40
  ) {
    const context = await this.loadConversationContext(conversationId);
    await this.assertReadable(context, actorUserId, role);
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    let cursorCondition;
    if (cursor) {
      const [cursorMessage] = await db
        .select({ id: messages.id, createdAt: messages.createdAt })
        .from(messages)
        .where(and(eq(messages.id, cursor), eq(messages.conversationId, conversationId)))
        .limit(1);
      if (!cursorMessage) {
        throw new AppError("Cursor پیام‌ها معتبر نیست.", "VALIDATION_ERROR", 422);
      }
      cursorCondition = or(
        lt(messages.createdAt, cursorMessage.createdAt),
        and(eq(messages.createdAt, cursorMessage.createdAt), lt(messages.id, cursorMessage.id))
      );
    }

    const rows = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderName: users.fullName,
        content: messages.content,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(
        cursorCondition
          ? and(eq(messages.conversationId, conversationId), cursorCondition)
          : eq(messages.conversationId, conversationId)
      )
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(safeLimit + 1);

    const hasMore = rows.length > safeLimit;
    const pageRows = rows.slice(0, safeLimit);
    const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null;
    const items = pageRows.reverse().map((row) => ({
      id: row.id,
      senderId: row.senderId,
      senderName: row.senderName,
      content: row.content,
      isMine: row.senderId === actorUserId,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      conversation: {
        id: conversationId,
        assignmentId: context.assignmentId,
        shiftTitle: context.shiftTitle,
        workerName: context.workerName,
        canSend:
          hasPermission(role, "message.send") &&
          !CLOSED_FOR_CHAT_STATES.has(context.assignmentState) &&
          Date.now() <= context.shiftEndAt.getTime() + CHAT_SEND_GRACE_MS,
      },
      items,
      nextCursor,
    };
  }

  async markRead(conversationId: string, actorUserId: string, role: UserRole) {
    const context = await this.loadConversationContext(conversationId);
    await this.assertReadable(context, actorUserId, role);
    const now = new Date();
    const updated = await db
      .update(messages)
      .set({ readAt: now })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, actorUserId),
          isNull(messages.readAt)
        )
      )
      .returning({ id: messages.id });

    if (updated.length > 0) {
      publishRealtimeEvent("assignment", context.assignmentId, "chat.read", {
        conversationId,
        readerId: actorUserId,
        readAt: now.toISOString(),
      });
    }
    return { markedRead: updated.length, readAt: now.toISOString() };
  }

  async sendMessage(
    conversationId: string,
    actorUserId: string,
    role: UserRole,
    content: string,
    idempotencyKey: string
  ) {
    const context = await this.loadConversationContext(conversationId);
    await this.assertSendable(context, actorUserId, role);
    const safeContent = content.trim();
    const safeKey = idempotencyKey.trim();
    if (!safeContent || safeContent.length > 2000) {
      throw new AppError("متن پیام باید بین ۱ تا ۲۰۰۰ کاراکتر باشد.", "VALIDATION_ERROR", 422);
    }
    if (safeKey.length < 8 || safeKey.length > 128) {
      throw new AppError("Idempotency-Key پیام معتبر نیست.", "VALIDATION_ERROR", 422);
    }

    const messageId = deterministicId("msg", `${conversationId}:${actorUserId}:${safeKey}`);
    let created = false;
    const message = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`message:${conversationId}:${actorUserId}`}))`
      );
      const [existing] = await tx.select().from(messages).where(eq(messages.id, messageId)).limit(1);
      if (existing) {
        if (
          existing.conversationId !== conversationId ||
          existing.senderId !== actorUserId ||
          existing.content !== safeContent
        ) {
          throw new AppError("این Idempotency-Key برای پیام دیگری استفاده شده است.", "CONFLICT", 409);
        }
        return existing;
      }

      const oneMinuteAgo = new Date(Date.now() - 60_000);
      const [{ value: recentCount }] = await tx
        .select({ value: count(messages.id) })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.senderId, actorUserId),
            gt(messages.createdAt, oneMinuteAgo)
          )
        );
      if (recentCount >= MAX_MESSAGES_PER_MINUTE) {
        throw new AppError(
          "تعداد پیام‌های ارسالی بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.",
          "RATE_LIMITED",
          429
        );
      }

      const [inserted] = await tx
        .insert(messages)
        .values({
          id: messageId,
          conversationId,
          senderId: actorUserId,
          content: safeContent,
          createdAt: new Date(),
        })
        .returning();
      created = true;
      return inserted;
    });

    const recipientUserId = actorUserId === context.workerId ? context.employerId : context.workerId;
    if (created) {
      const realtimePayload = {
        conversationId,
        messageId: message.id,
        assignmentId: context.assignmentId,
        senderId: actorUserId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      };
      publishRealtimeEvent("assignment", context.assignmentId, "chat.message", realtimePayload);
      publishRealtimeEvent("user", recipientUserId, "chat.message", realtimePayload);
      publishRealtimeEvent("user", actorUserId, "chat.message", realtimePayload);

      try {
        await notifications.createNotification({
          userId: recipientUserId,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "پیام جدید",
          body: safeContent.length > 120 ? `${safeContent.slice(0, 117)}...` : safeContent,
          data: { subtype: "MESSAGE", conversationId, assignmentId: context.assignmentId },
          idempotencyKey: `message:${message.id}:recipient:${recipientUserId}`,
          channels: ["PUSH"],
        });
      } catch (error) {
        console.error("[Message Notification Error]", {
          messageId: message.id,
          recipientUserId,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return {
      id: message.id,
      conversationId,
      senderId: message.senderId,
      content: message.content,
      readAt: message.readAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
      idempotent: !created,
    };
  }
}
