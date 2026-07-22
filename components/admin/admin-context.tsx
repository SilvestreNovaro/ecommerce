"use client";

import { createContext, useContext } from "react";
import type { AdminUser } from "@/lib/permissions";

const AdminContext = createContext<AdminUser | null>(null);

export function AdminProvider({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  return <AdminContext.Provider value={user}>{children}</AdminContext.Provider>;
}

export function useAdminUser(): AdminUser {
  const user = useContext(AdminContext);
  if (!user) throw new Error("useAdminUser fuera de AdminProvider");
  return user;
}
