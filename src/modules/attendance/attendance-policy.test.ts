import { describe, expect, it } from "vitest";
import { validateAttendancePolicy } from "./attendance-policy";

const base = {
  credentialBranchId: "branch_1",
  shiftBranchId: "branch_1",
  accuracyMeters: 12,
  maxAccuracyMeters: 80,
  distanceMeters: 25,
  geofenceRadiusMeters: 100,
  now: new Date("2026-08-16T08:00:00.000Z"),
  shiftStartAt: new Date("2026-08-16T08:00:00.000Z"),
  checkInEarlyMinutes: 30,
  checkInLateMinutes: 60,
};

describe("secure attendance policy", () => {
  it("accepts CHECK_IN for ARRIVED worker inside geofence", () => {
    expect(
      validateAttendancePolicy({ ...base, purpose: "CHECK_IN", assignmentState: "ARRIVED" })
    ).toBeNull();
  });

  it("rejects wrong branch", () => {
    expect(
      validateAttendancePolicy({
        ...base,
        purpose: "CHECK_IN",
        assignmentState: "ARRIVED",
        credentialBranchId: "branch_2",
      })
    ).toBe("QR_WRONG_BRANCH");
  });

  it("rejects low GPS accuracy", () => {
    expect(
      validateAttendancePolicy({
        ...base,
        purpose: "CHECK_IN",
        assignmentState: "ARRIVED",
        accuracyMeters: 150,
      })
    ).toBe("LOW_LOCATION_ACCURACY");
  });

  it("rejects early and late check-in", () => {
    expect(
      validateAttendancePolicy({
        ...base,
        purpose: "CHECK_IN",
        assignmentState: "ARRIVED",
        now: new Date("2026-08-16T07:00:00.000Z"),
      })
    ).toBe("CHECK_IN_TOO_EARLY");

    expect(
      validateAttendancePolicy({
        ...base,
        purpose: "CHECK_IN",
        assignmentState: "ARRIVED",
        now: new Date("2026-08-16T10:00:00.000Z"),
      })
    ).toBe("CHECK_IN_TOO_LATE");
  });

  it("requires CHECKED_IN and no active break for CHECK_OUT", () => {
    expect(
      validateAttendancePolicy({ ...base, purpose: "CHECK_OUT", assignmentState: "CHECKED_IN" })
    ).toBeNull();

    expect(
      validateAttendancePolicy({ ...base, purpose: "CHECK_OUT", assignmentState: "ON_BREAK" })
    ).toBe("ACTIVE_BREAK_EXISTS");
  });
});
