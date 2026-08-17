import { describe, expect, it } from "vitest";
import {
  relationshipIsHardBlocked,
  relationshipPriority,
} from "@/modules/relationships/relationship-policy";

describe("worker relationship policy", () => {
  it("ranks preferred above favorite above neutral", () => {
    expect(relationshipPriority("PREFERRED")).toBeGreaterThan(
      relationshipPriority("FAVORITE")
    );
    expect(relationshipPriority("FAVORITE")).toBeGreaterThan(
      relationshipPriority(null)
    );
  });

  it("does not promote blocked roster entries", () => {
    expect(relationshipPriority("BLOCKED")).toBe(0);
    expect(
      relationshipIsHardBlocked({
        rosterType: "BLOCKED",
        blockedByEmployer: false,
        blockedByWorker: false,
      })
    ).toBe(true);
  });

  it("treats either side block as a hard exclusion", () => {
    expect(
      relationshipIsHardBlocked({
        rosterType: "PREFERRED",
        blockedByEmployer: true,
        blockedByWorker: false,
      })
    ).toBe(true);
    expect(
      relationshipIsHardBlocked({
        rosterType: "FAVORITE",
        blockedByEmployer: false,
        blockedByWorker: true,
      })
    ).toBe(true);
  });

  it("allows non-blocked preferred/favorite workers through hard-filter stage", () => {
    expect(
      relationshipIsHardBlocked({
        rosterType: "PREFERRED",
        blockedByEmployer: false,
        blockedByWorker: false,
      })
    ).toBe(false);
  });
});
