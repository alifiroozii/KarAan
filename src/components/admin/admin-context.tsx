"use client";

import React, { createContext, useContext, useState } from "react";

export type AdminTab = "projects" | "users" | "overview" | "audit";

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isCreateProjectOpen: boolean;
  setIsCreateProjectOpen: (open: boolean) => void;
  pendingProjectsCount: number;
  setPendingProjectsCount: (count: number) => void;
  totalUsersCount: number;
  setTotalUsersCount: (count: number) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [pendingProjectsCount, setPendingProjectsCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isCreateProjectOpen,
        setIsCreateProjectOpen,
        pendingProjectsCount,
        setPendingProjectsCount,
        totalUsersCount,
        setTotalUsersCount,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
