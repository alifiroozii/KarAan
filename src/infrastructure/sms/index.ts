import { ISMSAdapter } from "./sms-adapter.interface";
import { MockSMSAdapter } from "./mock-sms.adapter";
import { KavenegarSMSAdapter } from "./kavenegar-sms.adapter";

export * from "./sms-adapter.interface";
export * from "./mock-sms.adapter";
export * from "./kavenegar-sms.adapter";

const mockInstance = new MockSMSAdapter();

export function getSMSAdapter(): ISMSAdapter {
  if (process.env.SMS_PROVIDER === "kavenegar" && process.env.KAVENEGAR_API_KEY) {
    return new KavenegarSMSAdapter();
  }
  return mockInstance;
}
