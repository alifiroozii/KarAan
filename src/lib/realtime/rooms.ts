export type RoomType = "user" | "worker" | "business" | "branch" | "shift" | "assignment";

export function formatRoomName(type: RoomType, id: string): string {
  return `${type}:${id}`;
}

export interface RoomAuthParams {
  userId: string;
  userRole: string;
  roomName: string;
}

/**
 * Server-side authorization check before allowing a Socket connection to join a room
 */
export function authorizeRoomJoin(params: RoomAuthParams): boolean {
  const { userId, userRole, roomName } = params;
  const [type, id] = roomName.split(":");

  if (!type || !id) return false;

  // Admins and Super Admins can monitor any room
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

  switch (type as RoomType) {
    case "user":
    case "worker":
      // User can only join their own personal user/worker room
      return userId === id;

    case "business":
    case "branch":
      // Business/Branch managers can join their organization rooms
      return ["EMPLOYER", "BRANCH_MANAGER", "SHIFT_SUPERVISOR"].includes(userRole);

    case "shift":
    case "assignment":
      // Shift/Assignment rooms accessible to workers and employers
      return true;

    default:
      return false;
  }
}
