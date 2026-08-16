import { TimesheetEngineService } from "./timesheet-engine.service";

/**
 * Public Timesheet domain service.
 *
 * Attendance owns presence mutations only. All timesheet calculation, review,
 * dispute and settlement-readiness behavior is exposed through this service.
 */
export class TimesheetService extends TimesheetEngineService {}
