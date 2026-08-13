import { ISMSAdapter } from "./sms-adapter.interface";

export class KavenegarSMSAdapter implements ISMSAdapter {
  private apiKey: string;

  constructor(apiKey = process.env.KAVENEGAR_API_KEY || "") {
    this.apiKey = apiKey;
  }

  async sendOTP(phone: string, code: string): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await fetch(
        `https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json?receptor=${phone}&token=${code}&template=karaan-otp`
      );
      const data = await res.json();
      return data?.return?.status === 200;
    } catch (err) {
      console.error("[Kavenegar SMS Error]", err);
      return false;
    }
  }

  async sendShiftAlert(
    phone: string,
    shiftTitle: string,
    startTimeStr: string
  ): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const message = encodeURIComponent(
        `شیفت جدید کارآن: ${shiftTitle}\nزمان: ${startTimeStr}`
      );
      const res = await fetch(
        `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json?receptor=${phone}&message=${message}`
      );
      const data = await res.json();
      return data?.return?.status === 200;
    } catch (err) {
      console.error("[Kavenegar SMS Error]", err);
      return false;
    }
  }

  async sendReminder(phone: string, message: string): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const encodedMsg = encodeURIComponent(message);
      const res = await fetch(
        `https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json?receptor=${phone}&message=${encodedMsg}`
      );
      const data = await res.json();
      return data?.return?.status === 200;
    } catch (err) {
      console.error("[Kavenegar SMS Error]", err);
      return false;
    }
  }
}
