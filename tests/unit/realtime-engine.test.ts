import { describe, it, expect } from "vitest";
import { authorizeRoomJoin, formatRoomName } from "@/lib/realtime/rooms";
import { RealtimeServerManager } from "@/lib/realtime/socket-server";
import { getQueryKeysToInvalidate } from "@/lib/realtime/query-invalidation";

describe("Realtime WebSockets Engine Unit Tests", () => {
  describe("Room Formatting & Authorization", () => {
    it("should format room names correctly", () => {
      expect(formatRoomName("worker", "usr_123")).toBe("worker:usr_123");
      expect(formatRoomName("shift", "shift_456")).toBe("shift:shift_456");
    });

    it("should authorize user to join their own personal worker room", () => {
      const allowed = authorizeRoomJoin({
        userId: "usr_101",
        userRole: "WORKER",
        roomName: "worker:usr_101",
      });
      expect(allowed).toBe(true);
    });

    it("should reject user trying to join another user's personal room", () => {
      const allowed = authorizeRoomJoin({
        userId: "usr_101",
        userRole: "WORKER",
        roomName: "worker:usr_999",
      });
      expect(allowed).toBe(false);
    });

    it("should allow ADMIN to join any room", () => {
      const allowed = authorizeRoomJoin({
        userId: "admin_007",
        userRole: "ADMIN",
        roomName: "business:biz_55",
      });
      expect(allowed).toBe(true);
    });
  });

  describe("RealtimeServerManager Connection & Broadcasting", () => {
    it("should register connection and broadcast events to joined room", () => {
      const manager = new RealtimeServerManager();
      const session = manager.registerConnection("sock_1", "usr_worker_1", "WORKER");

      expect(session.socketId).toBe("sock_1");
      expect(session.joinedRooms.has("user:usr_worker_1")).toBe(true);

      // Join shift room
      const joined = manager.joinRoom("sock_1", "shift", "shift_777");
      expect(joined).toBe(true);

      // Broadcast event to shift room
      const count = manager.broadcastToRoom("shift", "shift_777", "shift.published", {
        shiftId: "shift_777",
        publishedAt: new Date().toISOString(),
      });

      expect(count).toBe(1);
    });
  });

  describe("TanStack Query Cache Invalidation Mapping", () => {
    it("should return correct query keys to invalidate on shift events", () => {
      const keys = getQueryKeysToInvalidate("shift.published", { shiftId: "s1" });
      expect(keys).toEqual([["shifts"], ["employer", "shifts"], ["worker", "radar"]]);
    });

    it("should return correct query keys to invalidate on timesheet updates", () => {
      const keys = getQueryKeysToInvalidate("timesheet.updated", { timesheetId: "ts1" });
      expect(keys).toEqual([["timesheets"], ["employer", "timesheets"], ["worker", "earnings"]]);
    });
  });
});
