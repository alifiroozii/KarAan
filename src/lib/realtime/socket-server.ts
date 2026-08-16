import { RealtimeEventName, RealtimeEventPayloads } from "./events";
import { formatRoomName, RoomType, authorizeRoomJoin } from "./rooms";

export interface SocketConnectionSession {
  socketId: string;
  userId: string;
  userRole: string;
  joinedRooms: Set<string>;
}

export interface PublishedRealtimeEvent<E extends RealtimeEventName = RealtimeEventName> {
  room: string;
  event: E;
  payload: RealtimeEventPayloads[E];
  publishedAt: number;
}

type RealtimeListener = (event: PublishedRealtimeEvent) => void;

type SocketIoTransport = {
  to(room: string): {
    emit(event: string, payload: unknown): void;
  };
};

function getSocketTransport(): SocketIoTransport | undefined {
  return (
    globalThis as typeof globalThis & {
      __karaanSocketIO?: SocketIoTransport;
    }
  ).__karaanSocketIO;
}

/**
 * Realtime publication abstraction used by domain services.
 *
 * In tests it remains observable through subscribe(). In the self-hosted
 * runtime server.mjs injects the actual Socket.IO server on globalThis, so the
 * same publication is forwarded to an authenticated Socket.IO room.
 */
export class RealtimeServerManager {
  private connections = new Map<string, SocketConnectionSession>();
  private listeners = new Set<RealtimeListener>();

  registerConnection(socketId: string, userId: string, userRole: string): SocketConnectionSession {
    const session: SocketConnectionSession = {
      socketId,
      userId,
      userRole,
      joinedRooms: new Set<string>(),
    };

    session.joinedRooms.add(formatRoomName("user", userId));
    this.connections.set(socketId, session);
    return session;
  }

  joinRoom(socketId: string, roomType: RoomType, id: string): boolean {
    const session = this.connections.get(socketId);
    if (!session) return false;

    const roomName = formatRoomName(roomType, id);
    const isAuthorized = authorizeRoomJoin({
      userId: session.userId,
      userRole: session.userRole,
      roomName,
    });

    if (!isAuthorized) return false;
    session.joinedRooms.add(roomName);
    return true;
  }

  publish<E extends RealtimeEventName>(
    roomType: RoomType,
    id: string,
    event: E,
    payload: RealtimeEventPayloads[E]
  ): number {
    const room = formatRoomName(roomType, id);
    const envelope: PublishedRealtimeEvent<E> = {
      room,
      event,
      payload,
      publishedAt: Date.now(),
    };

    for (const listener of this.listeners) {
      listener(envelope as PublishedRealtimeEvent);
    }

    const transport = getSocketTransport();
    transport?.to(room).emit(event, payload);

    let recipientCount = 0;
    for (const session of this.connections.values()) {
      if (session.joinedRooms.has(room)) recipientCount++;
    }

    return recipientCount;
  }

  /** @deprecated use publish() */
  broadcastToRoom<E extends RealtimeEventName>(
    roomType: RoomType,
    id: string,
    event: E,
    payload: RealtimeEventPayloads[E]
  ): number {
    return this.publish(roomType, id, event, payload);
  }

  subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnectSocket(socketId: string): void {
    this.connections.delete(socketId);
  }
}

export const realtimeServer = new RealtimeServerManager();

export function publishRealtimeEvent<E extends RealtimeEventName>(
  roomType: RoomType,
  id: string,
  event: E,
  payload: RealtimeEventPayloads[E]
): number {
  return realtimeServer.publish(roomType, id, event, payload);
}
