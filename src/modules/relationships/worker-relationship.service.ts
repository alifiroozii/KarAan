import crypto from "crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { branches, businessMembers, employerProfiles } from "@/db/schema/employers";
import { blocks, workerRosters } from "@/db/schema/reviews";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { auditLogs } from "@/db/schema/system";
import { workerProfiles } from "@/db/schema/workers";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/modules/auth/auth.service";

export type EmployerRosterType = "FAVORITE" | "PREFERRED" | "BLOCKED";

interface ManagedRelationship {
  assignmentId: string;
  workerId: string;
  employerUserId: string;
  businessId: string | null;
  branchId: string | null;
}

export class WorkerRelationshipService {
  private async actorCanManageShift(
    shift: { employerId: string; businessId: string | null; branchId: string | null },
    actorUserId: string,
    role: UserRole
  ) {
    if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
    if (!["EMPLOYER", "BRANCH_MANAGER", "SHIFT_SUPERVISOR"].includes(role)) return false;
    if (shift.employerId === actorUserId) return true;

    if (shift.branchId) {
      const [managed] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, shift.branchId), eq(branches.managerUserId, actorUserId)))
        .limit(1);
      if (managed) return true;
    }

    if (shift.businessId) {
      const [member] = await db
        .select({ id: businessMembers.id })
        .from(businessMembers)
        .where(
          and(
            eq(businessMembers.businessId, shift.businessId),
            eq(businessMembers.userId, actorUserId)
          )
        )
        .limit(1);
      if (member) return true;
    }
    return false;
  }

  private async findManagedRelationship(
    actorUserId: string,
    role: UserRole,
    workerUserId: string
  ): Promise<ManagedRelationship> {
    const rows = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.workerId, workerUserId));

    for (const row of rows) {
      if (await this.actorCanManageShift(row.shift, actorUserId, role)) {
        return {
          assignmentId: row.assignment.id,
          workerId: workerUserId,
          employerUserId: row.shift.employerId,
          businessId: row.shift.businessId,
          branchId: row.shift.branchId,
        };
      }
    }
    throw new AppError("رابطه کاری مجاز با این Worker پیدا نشد.", "FORBIDDEN", 403);
  }

  private async resolveProfiles(employerUserId: string, workerUserId: string) {
    const [[employer], [worker]] = await Promise.all([
      db
        .select({ id: employerProfiles.id })
        .from(employerProfiles)
        .where(eq(employerProfiles.userId, employerUserId))
        .limit(1),
      db
        .select({ id: workerProfiles.id })
        .from(workerProfiles)
        .where(eq(workerProfiles.userId, workerUserId))
        .limit(1),
    ]);
    if (!employer || !worker) {
      throw new AppError("پروفایل طرفین رابطه پیدا نشد.", "NOT_FOUND", 404);
    }
    return { employerProfileId: employer.id, workerProfileId: worker.id };
  }

  async getEmployerRelationship(actorUserId: string, role: UserRole, workerUserId: string) {
    const relationship = await this.findManagedRelationship(actorUserId, role, workerUserId);
    const profiles = await this.resolveProfiles(relationship.employerUserId, workerUserId);
    const [roster, blockRows] = await Promise.all([
      db
        .select()
        .from(workerRosters)
        .where(
          and(
            eq(workerRosters.employerProfileId, profiles.employerProfileId),
            eq(workerRosters.workerProfileId, profiles.workerProfileId)
          )
        )
        .limit(1),
      db
        .select()
        .from(blocks)
        .where(
          or(
            and(
              eq(blocks.blockerUserId, relationship.employerUserId),
              eq(blocks.blockedUserId, workerUserId)
            ),
            and(
              eq(blocks.blockerUserId, workerUserId),
              eq(blocks.blockedUserId, relationship.employerUserId)
            )
          )
        ),
    ]);

    return {
      workerUserId,
      canonicalEmployerUserId: relationship.employerUserId,
      rosterType: roster[0]?.rosterType ?? null,
      blockedByEmployer: blockRows.some(
        (item) => item.blockerUserId === relationship.employerUserId
      ),
      blockedByWorker: blockRows.some((item) => item.blockerUserId === workerUserId),
    };
  }

  async setEmployerRoster(input: {
    actorUserId: string;
    actorRole: UserRole;
    workerUserId: string;
    rosterType: EmployerRosterType | null;
    notes?: string;
  }) {
    const relationship = await this.findManagedRelationship(
      input.actorUserId,
      input.actorRole,
      input.workerUserId
    );
    const profiles = await this.resolveProfiles(
      relationship.employerUserId,
      input.workerUserId
    );
    const now = new Date();

    let rosterId: string | null = null;
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`roster:${profiles.employerProfileId}:${profiles.workerProfileId}`}))`
      );
      const [existing] = await tx
        .select()
        .from(workerRosters)
        .where(
          and(
            eq(workerRosters.employerProfileId, profiles.employerProfileId),
            eq(workerRosters.workerProfileId, profiles.workerProfileId)
          )
        )
        .limit(1);

      if (input.rosterType == null) {
        if (existing) {
          await tx.delete(workerRosters).where(eq(workerRosters.id, existing.id));
        }
      } else if (existing) {
        rosterId = existing.id;
        await tx
          .update(workerRosters)
          .set({
            rosterType: input.rosterType,
            notes: input.notes?.trim() || null,
            updatedAt: now,
          })
          .where(eq(workerRosters.id, existing.id));
      } else {
        rosterId = `ros_${crypto.randomUUID()}`;
        await tx.insert(workerRosters).values({
          id: rosterId,
          employerProfileId: profiles.employerProfileId,
          workerProfileId: profiles.workerProfileId,
          rosterType: input.rosterType,
          notes: input.notes?.trim() || null,
          createdAt: now,
          updatedAt: now,
        });
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorUserId,
        entityName: "worker_roster",
        entityId: rosterId ?? existing?.id ?? `${profiles.employerProfileId}:${profiles.workerProfileId}`,
        action: input.rosterType ? "WORKER_ROSTER_UPDATED" : "WORKER_ROSTER_REMOVED",
        details: {
          workerUserId: input.workerUserId,
          canonicalEmployerUserId: relationship.employerUserId,
          rosterType: input.rosterType,
          previousRosterType: existing?.rosterType ?? null,
        },
      });
    });

    return this.getEmployerRelationship(input.actorUserId, input.actorRole, input.workerUserId);
  }

  private async deriveCounterparty(
    assignmentId: string,
    actorUserId: string,
    role: UserRole
  ) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, assignmentId))
      .limit(1);
    if (!row) throw new AppError("Assignment پیدا نشد.", "NOT_FOUND", 404);

    if (role === "WORKER" && actorUserId === row.assignment.workerId) {
      return {
        targetUserId: row.shift.employerId,
        side: "WORKER" as const,
        canonicalEmployerUserId: row.shift.employerId,
        workerUserId: row.assignment.workerId,
      };
    }

    if (await this.actorCanManageShift(row.shift, actorUserId, role)) {
      return {
        targetUserId: row.assignment.workerId,
        side: "EMPLOYER" as const,
        canonicalEmployerUserId: row.shift.employerId,
        workerUserId: row.assignment.workerId,
      };
    }

    throw new AppError("شما طرف مجاز این Assignment نیستید.", "FORBIDDEN", 403);
  }

  async getCounterpartyBlock(assignmentId: string, actorUserId: string, role: UserRole) {
    const relation = await this.deriveCounterparty(assignmentId, actorUserId, role);
    const [mine, theirs] = await Promise.all([
      db
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerUserId, actorUserId),
            eq(blocks.blockedUserId, relation.targetUserId)
          )
        )
        .limit(1),
      db
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerUserId, relation.targetUserId),
            eq(blocks.blockedUserId, actorUserId)
          )
        )
        .limit(1),
    ]);

    return {
      assignmentId,
      targetUserId: relation.targetUserId,
      blockedByMe: Boolean(mine[0]),
      blockedMe: Boolean(theirs[0]),
      reason: mine[0]?.reason ?? null,
    };
  }

  async setCounterpartyBlock(input: {
    assignmentId: string;
    actorUserId: string;
    actorRole: UserRole;
    blocked: boolean;
    reason?: string;
  }) {
    const relation = await this.deriveCounterparty(
      input.assignmentId,
      input.actorUserId,
      input.actorRole
    );
    if (relation.targetUserId === input.actorUserId) {
      throw new AppError("Block کردن خود کاربر مجاز نیست.", "BAD_REQUEST", 400);
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`block:${input.actorUserId}:${relation.targetUserId}`}))`
      );
      const [existing] = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerUserId, input.actorUserId),
            eq(blocks.blockedUserId, relation.targetUserId)
          )
        )
        .limit(1);

      if (input.blocked && !existing) {
        await tx.insert(blocks).values({
          id: `blk_${crypto.randomUUID()}`,
          blockerUserId: input.actorUserId,
          blockedUserId: relation.targetUserId,
          reason: input.reason?.trim() || null,
          createdAt: now,
        });
      } else if (input.blocked && existing) {
        await tx
          .update(blocks)
          .set({ reason: input.reason?.trim() || existing.reason })
          .where(eq(blocks.id, existing.id));
      } else if (!input.blocked && existing) {
        await tx.delete(blocks).where(eq(blocks.id, existing.id));
      }

      if (relation.side === "EMPLOYER") {
        const profiles = await this.resolveProfiles(
          relation.canonicalEmployerUserId,
          relation.workerUserId
        );
        const [roster] = await tx
          .select()
          .from(workerRosters)
          .where(
            and(
              eq(workerRosters.employerProfileId, profiles.employerProfileId),
              eq(workerRosters.workerProfileId, profiles.workerProfileId)
            )
          )
          .limit(1);

        if (input.blocked) {
          if (roster) {
            await tx
              .update(workerRosters)
              .set({ rosterType: "BLOCKED", updatedAt: now })
              .where(eq(workerRosters.id, roster.id));
          } else {
            await tx.insert(workerRosters).values({
              id: `ros_${crypto.randomUUID()}`,
              employerProfileId: profiles.employerProfileId,
              workerProfileId: profiles.workerProfileId,
              rosterType: "BLOCKED",
              createdAt: now,
              updatedAt: now,
            });
          }
        } else if (roster?.rosterType === "BLOCKED") {
          await tx.delete(workerRosters).where(eq(workerRosters.id, roster.id));
        }
      }

      await tx.insert(auditLogs).values({
        id: `aud_${crypto.randomUUID()}`,
        actorId: input.actorUserId,
        entityName: "block",
        entityId: `${input.actorUserId}:${relation.targetUserId}`,
        action: input.blocked ? "COUNTERPARTY_BLOCKED" : "COUNTERPARTY_UNBLOCKED",
        details: {
          assignmentId: input.assignmentId,
          targetUserId: relation.targetUserId,
          side: relation.side,
          reason: input.reason?.trim() || null,
        },
      });
    });

    return this.getCounterpartyBlock(input.assignmentId, input.actorUserId, input.actorRole);
  }
}
