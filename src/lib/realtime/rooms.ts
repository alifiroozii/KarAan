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
 * Lightweight role gate. Domain services still enforce object-level ownership
 * before publishing or returning sensitive assignment/location data.
 */
export function authorizeRoomJoin(params: RoomAuthParams): boolean {
  const { userId, userRole, roomName } = params;
  const [type, id] = roomName.split(":");
  if (!type || !id) return false;

  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

  switch (type as RoomType) {
    case "user":
    case "worker":
      return userId === id;
    case "business":
    case "branch":
      return ["EMPLOYER", "BRANCH_MANAGER", "SHIFT_SUPERVISOR"].includes(userRole);
    case "shift":
    case "assignment":
      return ["WORKER", "EMPLOYER", "BRANCH_MANAGER", "SHIFT_SUPERVISOR", "SUPPORT_AGENT"].includes(userRole);
    default:
      return false;
  }
}
