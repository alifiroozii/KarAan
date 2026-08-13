export type UserRole = "WORKER" | "EMPLOYER" | "ADMIN";

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
