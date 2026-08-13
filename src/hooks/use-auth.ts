"use client";

import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isWorker: user?.role === "WORKER",
    isEmployer: user?.role === "EMPLOYER",
    isAdmin: user?.role === "ADMIN",
    setAuth,
    logout,
  };
}
