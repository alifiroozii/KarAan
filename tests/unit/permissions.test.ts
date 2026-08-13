import { describe, it, expect } from "vitest";
import {
  hasPermission,
  assertPermission,
  assertOwnership,
} from "@/modules/auth/permissions";

describe("Permissions & Security Unit Tests", () => {
  describe("Granular RBAC Permissions", () => {
    it("should allow WORKER to view shifts and check-in", () => {
      expect(hasPermission("WORKER", "shift.view")).toBe(true);
      expect(hasPermission("WORKER", "shift.checkin")).toBe(true);
      expect(hasPermission("WORKER", "shift.create")).toBe(false);
    });

    it("should allow EMPLOYER to create shifts and approve timesheets", () => {
      expect(hasPermission("EMPLOYER", "shift.create")).toBe(true);
      expect(hasPermission("EMPLOYER", "timesheet.approve")).toBe(true);
      expect(hasPermission("EMPLOYER", "admin.users.manage")).toBe(false);
    });

    it("should allow DISPUTE_AGENT to manage disputes but not create shifts", () => {
      expect(hasPermission("DISPUTE_AGENT", "dispute.manage")).toBe(true);
      expect(hasPermission("DISPUTE_AGENT", "shift.create")).toBe(false);
    });

    it("should throw AppError on unauthorized permission assertion", () => {
      expect(() => assertPermission("WORKER", "admin.users.manage")).toThrowError(
        "شما دسترسی لازم برای انجام این عملیات (admin.users.manage) را ندارید."
      );
    });
  });

  describe("Object-Level Authorization (Ownership)", () => {
    it("should allow resource access when actor is the owner", () => {
      expect(() => assertOwnership("usr_employer_1", "usr_employer_1", "EMPLOYER")).not.toThrow();
    });

    it("should reject access when Employer A attempts to access Employer B's resource", () => {
      expect(() =>
        assertOwnership("usr_employer_A", "usr_employer_B", "EMPLOYER")
      ).toThrowError("شما مجوز دسترسی یا تغییر اطلاعات کاربر دیگری را ندارید.");
    });

    it("should allow ADMIN or SUPER_ADMIN to override ownership check", () => {
      expect(() => assertOwnership("admin_101", "usr_employer_B", "ADMIN")).not.toThrow();
      expect(() => assertOwnership("super_1", "usr_employer_B", "SUPER_ADMIN")).not.toThrow();
    });
  });
});
