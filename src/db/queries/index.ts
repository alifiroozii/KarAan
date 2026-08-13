import { db } from "../index";
import { users, shifts } from "../schema";
import { eq } from "drizzle-orm";

export async function getUserById(userId: string) {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function getShiftById(shiftId: string) {
  const result = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
  return result[0] || null;
}
