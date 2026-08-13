import { UserRole } from "./auth.service";
import { AppError } from "@/lib/errors";

export type Permission =
  // Worker Permissions
  | "worker.profile.read"
  | "worker.profile.update"
  | "worker.availability.update"
  | "worker.documents.upload"
  // Employer & Business Permissions
  | "employer.profile.read"
  | "employer.profile.update"
  | "business.create"
  | "business.read"
  | "business.update"
  | "business.delete"
  | "branch.create"
  | "branch.read"
  | "branch.update"
  | "branch.delete"
  // Shift Operations
  | "shift.create"
  | "shift.view"
  | "shift.publish"
  | "shift.update"
  | "shift.cancel"
  | "shift.apply"
  | "shift.accept"
  | "shift.checkin"
  | "shift.checkout"
  // Timesheets & Finance
  | "timesheet.view"
  | "timesheet.approve"
  | "timesheet.dispute"
  | "payment.view"
  | "payment.topup"
  | "payment.payout"
  // Disputes & Support
  | "dispute.create"
  | "dispute.view"
  | "dispute.manage"
  // Admin & System
  | "admin.users.manage"
  | "admin.audit.view"
  | "admin.system.manage";

/**
 * Role to Granular Permissions Mapping Matrix (RBAC)
 */
export const ROLE_PERMISSIONS_MAP: Record<UserRole, Permission[]> = {
  WORKER: [
    "worker.profile.read",
    "worker.profile.update",
    "worker.availability.update",
    "worker.documents.upload",
    "shift.view",
    "shift.apply",
    "shift.checkin",
    "shift.checkout",
    "timesheet.view",
    "timesheet.dispute",
    "payment.view",
    "payment.payout",
    "dispute.create",
    "dispute.view",
  ],
  EMPLOYER: [
    "employer.profile.read",
    "employer.profile.update",
    "business.create",
    "business.read",
    "business.update",
    "business.delete",
    "branch.create",
    "branch.read",
    "branch.update",
    "branch.delete",
    "shift.create",
    "shift.view",
    "shift.publish",
    "shift.update",
    "shift.cancel",
    "shift.accept",
    "timesheet.view",
    "timesheet.approve",
    "timesheet.dispute",
    "payment.view",
    "payment.topup",
    "dispute.create",
    "dispute.view",
  ],
  BRANCH_MANAGER: [
    "employer.profile.read",
    "business.read",
    "branch.read",
    "branch.update",
    "shift.create",
    "shift.view",
    "shift.publish",
    "shift.update",
    "shift.cancel",
    "shift.accept",
    "timesheet.view",
    "timesheet.approve",
    "dispute.create",
    "dispute.view",
  ],
  SHIFT_SUPERVISOR: [
    "business.read",
    "branch.read",
    "shift.view",
    "timesheet.view",
    "timesheet.approve",
  ],
  SUPPORT_AGENT: [
    "worker.profile.read",
    "employer.profile.read",
    "business.read",
    "branch.read",
    "shift.view",
    "timesheet.view",
    "dispute.view",
    "admin.audit.view",
  ],
  DISPUTE_AGENT: [
    "worker.profile.read",
    "employer.profile.read",
    "shift.view",
    "timesheet.view",
    "dispute.view",
    "dispute.manage",
    "admin.audit.view",
  ],
  FINANCE_ADMIN: [
    "employer.profile.read",
    "worker.profile.read",
    "shift.view",
    "timesheet.view",
    "payment.view",
    "payment.topup",
    "payment.payout",
    "admin.audit.view",
  ],
  ADMIN: [
    "worker.profile.read",
    "worker.profile.update",
    "employer.profile.read",
    "employer.profile.update",
    "business.read",
    "business.update",
    "branch.read",
    "branch.update",
    "shift.create",
    "shift.view",
    "shift.publish",
    "shift.update",
    "shift.cancel",
    "timesheet.view",
    "timesheet.approve",
    "payment.view",
    "dispute.view",
    "dispute.manage",
    "admin.users.manage",
    "admin.audit.view",
  ],
  SUPER_ADMIN: [
    "worker.profile.read",
    "worker.profile.update",
    "worker.availability.update",
    "worker.documents.upload",
    "employer.profile.read",
    "employer.profile.update",
    "business.create",
    "business.read",
    "business.update",
    "business.delete",
    "branch.create",
    "branch.read",
    "branch.update",
    "branch.delete",
    "shift.create",
    "shift.view",
    "shift.publish",
    "shift.update",
    "shift.cancel",
    "shift.apply",
    "shift.accept",
    "shift.checkin",
    "shift.checkout",
    "timesheet.view",
    "timesheet.approve",
    "timesheet.dispute",
    "payment.view",
    "payment.topup",
    "payment.payout",
    "dispute.create",
    "dispute.view",
    "dispute.manage",
    "admin.users.manage",
    "admin.audit.view",
    "admin.system.manage",
  ],
};

/**
 * Check if a role possesses a specific granular permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS_MAP[role] || [];
  return permissions.includes(permission);
}

/**
 * Asserts that a role possesses a specific permission or throws 403 Forbidden.
 */
export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new AppError(
      `شما دسترسی لازم برای انجام این عملیات (${permission}) را ندارید.`,
      "FORBIDDEN",
      403,
      { requiredPermission: permission, userRole: role }
    );
  }
}

/**
 * Object-level Authorization Check (Ownership Enforcement).
 * Ensures a user only accesses resources they own unless they are an ADMIN/SUPER_ADMIN.
 */
export function assertOwnership(
  actorUserId: string,
  resourceOwnerId: string,
  actorRole?: UserRole
): void {
  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN") {
    return; // System Administrators override ownership
  }

  if (actorUserId !== resourceOwnerId) {
    throw new AppError(
      "شما مجوز دسترسی یا تغییر اطلاعات کاربر دیگری را ندارید.",
      "FORBIDDEN",
      403,
      { actorUserId, resourceOwnerId }
    );
  }
}
