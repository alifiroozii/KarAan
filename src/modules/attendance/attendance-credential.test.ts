import { describe, expect, it } from "vitest";
import {
  buildSupervisorCodeHash,
  hashAttendanceCredential,
} from "./attendance-credential.service";

describe("attendance credential hashing", () => {
  it("is deterministic without exposing raw credentials", () => {
    const raw = "secret-attendance-token";
    const hash = hashAttendanceCredential(raw);
    expect(hash).toBe(hashAttendanceCredential(raw));
    expect(hash).not.toContain(raw);
    expect(hash).toHaveLength(64);
  });

  it("binds supervisor code hash to branch and purpose", () => {
    const code = "482931";
    expect(buildSupervisorCodeHash("b1", "CHECK_IN", code)).not.toBe(
      buildSupervisorCodeHash("b2", "CHECK_IN", code)
    );
    expect(buildSupervisorCodeHash("b1", "CHECK_IN", code)).not.toBe(
      buildSupervisorCodeHash("b1", "CHECK_OUT", code)
    );
  });
});
