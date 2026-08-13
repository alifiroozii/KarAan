import { ISMSAdapter } from "./sms-adapter.interface";

export class MockSMSAdapter implements ISMSAdapter {
  public sentMessages: { phone: string; message: string; type: string }[] = [];

  async sendOTP(phone: string, code: string): Promise<boolean> {
    const message = `کد تایید کارآن: ${code}`;
    console.log(`[MockSMS] OTP sent to ${phone}: ${message}`);
    this.sentMessages.push({ phone, message, type: "OTP" });
    return true;
  }

  async sendShiftAlert(
    phone: string,
    shiftTitle: string,
    startTimeStr: string
  ): Promise<boolean> {
    const message = `فرصت شغلی جدید در کارآن: ${shiftTitle} - زمان: ${startTimeStr}`;
    console.log(`[MockSMS] Shift alert sent to ${phone}: ${message}`);
    this.sentMessages.push({ phone, message, type: "SHIFT_ALERT" });
    return true;
  }

  async sendReminder(phone: string, message: string): Promise<boolean> {
    console.log(`[MockSMS] Reminder sent to ${phone}: ${message}`);
    this.sentMessages.push({ phone, message, type: "REMINDER" });
    return true;
  }
}
