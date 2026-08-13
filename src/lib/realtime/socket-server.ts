import { RealtimeEventName, RealtimeEventPayloads } from "./events";
import { formatRoomName, RoomType, authorizeRoomJoin } from "./rooms";

export interface SocketConnectionSession {
  socketId: string;
  userId: string;
  userRole: string;
  joinedRooms: Set<string>;
}

export class RealtimeServerManager {
  private connections = new Map<string, SocketConnectionSession>();

  /**
   * Authenticate and register a new Socket connection
   */
  registerConnection(socketId: string, userId: string, userRole: string): SocketConnectionSession {
    const session: SocketConnectionSession = {
      socketId,
      userId,
      userRole,
      joinedRooms: new Set<string>(),
    };

    // Auto-join personal user room user:{userId}
    const personalRoom = formatRoomName("user", userId);
    session.joinedRooms.add(personalRoom);

    this.connections.set(socketId, session);
    return session;
  }

  /**
   * Authorize and join socket to room
   */
  joinRoom(socketId: string, roomType: RoomType, id: string): boolean {
    const session = this.connections.get(socketId);
    if (!session) return false;

    const roomName = formatRoomName(roomType, id);
    const isAuthorized = authorizeRoomJoin({
      userId: session.userId,
      userRole: session.userRole,
      roomName,
    });

    if (isAuthorized) {
      session.joinedRooms.add(roomName);
      return true;
    }

    return false;
  }

  /**
   * Broadcast type-safe event to room
   */
  broadcastToRoom<E extends RealtimeEventName>(
    roomType: RoomType,
    id: string,
    event: E,
    payload: RealtimeEventPayloads[E]
  ): number {
    const roomName = formatRoomName(roomType, id);
    let recipientCount = 0;

    for (const session of this.connections.values()) {
      if (session.joinedRooms.has(roomName)) {
        recipientCount++;
      }
    }

    return recipientCount;
  }

  disconnectSocket(socketId: string): void {
    this.connections.delete(socketId);
  }
}

export const realtimeServer = new RealtimeServerManager();
