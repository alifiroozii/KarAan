import { afterEach, describe, expect, it, vi } from "vitest";
import { publishRealtimeEvent } from "./socket-server";

describe("publishRealtimeEvent", () => {
  afterEach(() => {
    delete (
      globalThis as typeof globalThis & {
        __karaanSocketIO?: unknown;
      }
    ).__karaanSocketIO;
  });

  it("forwards a typed event to the target Socket.IO room", () => {
    const emit = vi.fn();
    const to = vi.fn(() => ({ emit }));
    (
      globalThis as typeof globalThis & {
        __karaanSocketIO?: { to: typeof to };
      }
    ).__karaanSocketIO = { to };

    publishRealtimeEvent("assignment", "asg_1", "assignment.updated", {
      assignmentId: "asg_1",
      state: "EN_ROUTE",
    });

    expect(to).toHaveBeenCalledWith("assignment:asg_1");
    expect(emit).toHaveBeenCalledWith("assignment.updated", {
      assignmentId: "asg_1",
      state: "EN_ROUTE",
    });
  });
});
