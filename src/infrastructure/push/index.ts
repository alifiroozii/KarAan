import type { IPushAdapter } from "./push-adapter.interface";
import { NoopPushAdapter } from "./noop-push.adapter";

export * from "./push-adapter.interface";
export * from "./noop-push.adapter";

const noopPushAdapter = new NoopPushAdapter();

export function getPushAdapter(): IPushAdapter {
  return noopPushAdapter;
}
