import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, systemSettings } from "@/db/schema/system";
import { shiftAssignments, shifts } from "@/db/schema/shifts";
import { getMapAdapter } from "@/infrastructure/map";
import { AppError } from "@/lib/errors";
import {
  AttendanceCredentialService,
  type AttendanceCredentialMetadata,
  type AttendancePurpose,
} from "./attendance-credential.service";
import { validateAttendancePolicy } from "./attendance-policy";
import { AttendanceService } from "./attendance.service";

interface AttendanceLocationInput {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  deviceId?: string;
}

export class SecureAttendanceService {
  private credentials = new AttendanceCredentialService();
  private attendance = new AttendanceService();
  private mapAdapter = getMapAdapter();

  private async readNumericSetting(
    key: string,
    fallback: number,
    property: "minutes" | "meters"
  ): Promise<number> {
    const [setting] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    const raw = setting?.value;
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
    if (raw && typeof raw === "object" && property in raw) {
      const value = Number((raw as Record<string, unknown>)[property]);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    return fallback;
  }

  private async validateAndRun(input: {
    assignmentId: string;
    workerUserId: string;
    purpose: AttendancePurpose;
    credential: AttendanceCredentialMetadata;
    location: AttendanceLocationInput;
  }) {
    const [row] = await db
      .select({ assignment: shiftAssignments, shift: shifts })
      .from(shiftAssignments)
      .innerJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(eq(shiftAssignments.id, input.assignmentId))
      .limit(1);

    if (!row) throw new AppError("انتصاب شیفت پیدا نشد.", "NOT_FOUND", 404);
    if (row.assignment.workerId !== input.workerUserId) {
      throw new AppError("این شیفت متعلق به حساب شما نیست.", "FORBIDDEN", 403);
    }
    if (input.credential.purpose !== input.purpose) {
      throw new AppError("این کد برای این عملیات معتبر نیست.", "QR_WRONG_PURPOSE", 400);
    }

    if (
      input.purpose === "CHECK_IN" &&
      (row.assignment.state === "CHECKED_IN" || row.assignment.state === "ON_BREAK")
    ) {
      if (!row.shift.branchId || input.credential.branchId !== row.shift.branchId) {
        throw new AppError("QR متعلق به شعبه دیگری است.", "QR_WRONG_BRANCH", 400);
      }
      return {
        assignmentId: input.assignmentId,
        state: row.assignment.state,
        checkedInAt: row.assignment.checkedInAt,
        idempotent: true,
      };
    }

    if (
      input.purpose === "CHECK_OUT" &&
      (row.assignment.state === "CHECKED_OUT" || row.assignment.state === "COMPLETED")
    ) {
      if (!row.shift.branchId || input.credential.branchId !== row.shift.branchId) {
        throw new AppError("QR متعلق به شعبه دیگری است.", "QR_WRONG_BRANCH", 400);
      }
      return {
        assignmentId: input.assignmentId,
        state: row.assignment.state,
        checkedOutAt: row.assignment.checkedOutAt,
        idempotent: true,
      };
    }

    const distanceMeters = this.mapAdapter.calculateDistanceMeters(
      {
        latitude: input.location.latitude,
        longitude: input.location.longitude,
      },
      { latitude: row.shift.latitude, longitude: row.shift.longitude }
    );

    const [maxAccuracyMeters, checkInEarlyMinutes, checkInLateMinutes] = await Promise.all([
      this.readNumericSetting("location.max_accuracy_meters", 80, "meters"),
      this.readNumericSetting("attendance.check_in_early_minutes", 30, "minutes"),
      this.readNumericSetting("attendance.check_in_late_minutes", 60, "minutes"),
    ]);

    const policyError = validateAttendancePolicy({
      purpose: input.purpose,
      credentialBranchId: input.credential.branchId,
      shiftBranchId: row.shift.branchId,
      assignmentState: row.assignment.state,
      accuracyMeters: input.location.accuracyMeters,
      maxAccuracyMeters,
      distanceMeters,
      geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
      now: new Date(),
      shiftStartAt: row.shift.startAt,
      checkInEarlyMinutes,
      checkInLateMinutes,
    });

    if (policyError) {
      const messages: Record<string, string> = {
        QR_WRONG_BRANCH: "QR متعلق به شعبه این شیفت نیست.",
        LOW_LOCATION_ACCURACY: "دقت GPS برای ثبت حضور کافی نیست.",
        OUTSIDE_GEOFENCE: "برای ثبت حضور باید داخل محدوده محل شیفت باشید.",
        INVALID_ASSIGNMENT_STATE: "وضعیت فعلی شیفت اجازه این عملیات را نمی‌دهد.",
        ACTIVE_BREAK_EXISTS: "ابتدا استراحت فعال را پایان دهید، سپس خروج را ثبت کنید.",
        CHECK_IN_TOO_EARLY: "هنوز برای ثبت ورود این شیفت زود است.",
        CHECK_IN_TOO_LATE: "پنجره زمانی ثبت ورود این شیفت گذشته است.",
      };
      throw new AppError(
        messages[policyError] || "اعتبارسنجی حضور ناموفق بود.",
        policyError,
        400,
        {
          distanceMeters,
          geofenceRadiusMeters: row.shift.geofenceRadiusMeters,
          accuracyMeters: input.location.accuracyMeters,
          maxAccuracyMeters,
        }
      );
    }

    const result =
      input.purpose === "CHECK_IN"
        ? await this.attendance.checkInWorker(
            input.assignmentId,
            input.workerUserId,
            input.location.latitude,
            input.location.longitude
          )
        : await this.attendance.checkOutWorker(
            input.assignmentId,
            input.workerUserId,
            input.location.latitude,
            input.location.longitude
          );

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: input.workerUserId,
      entityName: "shift_assignment",
      entityId: input.assignmentId,
      action:
        input.purpose === "CHECK_IN"
          ? "ATTENDANCE_CREDENTIAL_CHECK_IN"
          : "ATTENDANCE_CREDENTIAL_CHECK_OUT",
      details: {
        credentialId: input.credential.credentialId,
        credentialKind: input.credential.kind,
        branchId: input.credential.branchId,
        purpose: input.purpose,
        accuracyMeters: input.location.accuracyMeters,
        distanceMeters,
        deviceId: input.location.deviceId || null,
      },
    });

    return result;
  }

  async processQr(input: {
    qrToken: string;
    assignmentId: string;
    workerUserId: string;
    purpose: AttendancePurpose;
    location: AttendanceLocationInput;
  }) {
    const credential = await this.credentials.resolveQrToken(input.qrToken);
    return this.validateAndRun({
      assignmentId: input.assignmentId,
      workerUserId: input.workerUserId,
      purpose: input.purpose,
      credential,
      location: input.location,
    });
  }

  async processSupervisorCode(input: {
    code: string;
    branchId: string;
    assignmentId: string;
    workerUserId: string;
    purpose: AttendancePurpose;
    location: AttendanceLocationInput;
  }) {
    const claim = await this.credentials.claimSupervisorCode({
      branchId: input.branchId,
      purpose: input.purpose,
      code: input.code,
    });

    try {
      const result = await this.validateAndRun({
        assignmentId: input.assignmentId,
        workerUserId: input.workerUserId,
        purpose: input.purpose,
        credential: claim.metadata,
        location: input.location,
      });

      await this.credentials.consumeSupervisorCodeClaim(claim);
      return result;
    } catch (error) {
      await this.credentials.releaseSupervisorCodeClaim(claim);
      throw error;
    }
  }
}
