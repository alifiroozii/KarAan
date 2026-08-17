export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  tokens: string[];
}

export interface PushSendResult {
  delivered: boolean;
  unavailable?: boolean;
  providerMessageId?: string;
}

export interface IPushAdapter {
  send(message: PushMessage): Promise<PushSendResult>;
}
