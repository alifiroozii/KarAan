export type UserRole = "WORKER" | "EMPLOYER" | "ADMIN";

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}
