import { UserRole } from "./auth.service";

export type { UserRole };

export interface JWTPayload {
  userId: string;
  phone: string;
  role: UserRole;
  fullName: string;
  iat: number;
  exp: number;
}

export interface AuthSession {
  userId: string;
  phone: string;
  role: UserRole;
  fullName: string;
}
