import { AttendanceService } from "@/modules/attendance/attendance.service";

/**
 * @deprecated Attendance mutations now have a single source of truth in
 * AttendanceService. Prompt 22 will replace this compatibility facade with the
 * dedicated Timesheet calculation engine.
 */
export class TimesheetService {
  private attendance = new AttendanceService();

  async checkInWorker(
    assignmentId: string,
    workerUserId: string,
    latitude: number,
    longitude: number
  ) {
    return this.attendance.checkInWorker(
      assignmentId,
      workerUserId,
      latitude,
      longitude
    );
  }

  async checkOutWorker(
    assignmentId: string,
    workerUserId: string,
    latitude: number,
    longitude: number
  ) {
    return this.attendance.checkOutWorker(
      assignmentId,
      workerUserId,
      latitude,
      longitude
    );
  }
}
