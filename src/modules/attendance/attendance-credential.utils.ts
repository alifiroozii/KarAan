import crypto from "crypto";
import type { AttendancePurpose } from "./attendance-credential.service";

export function hashAttendanceCredential(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function buildSupervisorCodeHash(
  branchId: string,
  purpose: AttendancePurpose,
  code: string
): string {
  return hashAttendanceCredential(`${branchId}:${purpose}:${code}`);
}
