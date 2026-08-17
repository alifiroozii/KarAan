import type { IPushAdapter, PushMessage, PushSendResult } from "./push-adapter.interface";

/**
 * Push is intentionally provider-ready in Prompt 33. Until a real Web Push /
 * FCM provider is configured, we fail closed and never claim a delivery.
 */
export class NoopPushAdapter implements IPushAdapter {
  async send(_message: PushMessage): Promise<PushSendResult> {
    return { delivered: false, unavailable: true };
  }
}
