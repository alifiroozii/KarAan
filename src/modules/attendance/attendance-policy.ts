import type { AttendancePurpose } from "./attendance-credential.service";

export type AttendancePolicyError =
  | "QR_WRONG_BRANCH"
  | "QR_WRONG_PURPOSE"
  | "LOW_LOCATION_ACCURACY"
  | "OUTSIDE_GEOFENCE"
  | "INVALID_ASSIGNMENT_STATE"
  | "ACTIVE_BREAK_EXISTS"
  | "CHECK_IN_TOO_EARLY"
  | "CHECK_IN_TOO_LATE";

export function validateAttendancePolicy(input: {
  purpose: AttendancePurpose;
  credentialBranchId: string;
  shiftBranchId: string | null;
  assignmentState: string;
  accuracyMeters: number;
  maxAccuracyMeters: number;
  distanceMeters: number;
  geofenceRadiusMeters: number;
  now: Date;
  shiftStartAt: Date;
  checkInEarlyMinutes: number;
  checkInLateMinutes: number;
}): AttendancePolicyError | null {
  if (!input.shiftBranchId || input.credentialBranchId !== input.shiftBranchId) {
    return "QR_WRONG_BRANCH";
  }

  if (input.accuracyMeters > input.maxAccuracyMeters) {
    return "LOW_LOCATION_ACCURACY";
  }

  if (input.distanceMeters > input.geofenceRadiusMeters) {
    return "OUTSIDE_GEOFENCE";
  }

  if (input.purpose === "CHECK_IN") {
    if (input.assignmentState !== "ARRIVED") return "INVALID_ASSIGNMENT_STATE";

    const earliest = input.shiftStartAt.getTime() - input.checkInEarlyMinutes * 60_000;
    const latest = input.shiftStartAt.getTime() + input.checkInLateMinutes * 60_000;
    if (input.now.getTime() < earliest) return "CHECK_IN_TOO_EARLY";
    if (input.now.getTime() > latest) return "CHECK_IN_TOO_LATE";
    return null;
  }

  if (input.assignmentState === "ON_BREAK") return "ACTIVE_BREAK_EXISTS";
  if (input.assignmentState !== "CHECKED_IN") return "INVALID_ASSIGNMENT_STATE";
  return null;
}
