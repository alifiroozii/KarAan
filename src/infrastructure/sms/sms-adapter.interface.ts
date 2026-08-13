export interface ISMSAdapter {
  sendOTP(phone: string, code: string): Promise<boolean>;
  sendShiftAlert(
    phone: string,
    shiftTitle: string,
    startTimeStr: string
  ): Promise<boolean>;
  sendReminder(
    phone: string,
    message: string
  ): Promise<boolean>;
}
