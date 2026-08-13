export interface RealtimeServerEvent {
  event: string;
  payload: Record<string, unknown>;
}
