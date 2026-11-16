"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "principal" | "coordinator" | "teacher" | "counsellor" | "student" | "parent";
  status: "active" | "disabled";
  mustChangePassword?: boolean;
  schoolId: string;
  admissionNo?: string;
  classId?: string;
  sectionId?: string;
  childIds?: string[];
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  getRolePath: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getRolePath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "principal":
      return "/principal";
    case "coordinator":
      return "/coordinator";
    case "counsellor":
      return "/counsellor";
    default:
      return "/login";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const res = await api.get<{ user: User; permissions: string[] }>("/api/auth/me");
      setUser(res.user);
      setPermissions(res.permissions || []);
      return res.user;
    } catch (err: any) {
      setUser(null);
      setPermissions([]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ user: User; permissions: string[] }>("/api/auth/login", {
      email,
      password,
    });
    setUser(res.user);
    setPermissions(res.permissions || []);

    if (res.user.mustChangePassword) {
      router.push("/change-password");
    } else {
      router.push(getRolePath(res.user.role));
    }

    return res.user;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // Continue even if call fails
    }
    setUser(null);
    setPermissions([]);
    router.push("/login");
  };

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    await api.post("/api/auth/change-password", {
      newPassword,
      currentPassword,
    });
    if (user) {
      setUser({ ...user, mustChangePassword: false });
      router.push(getRolePath(user.role));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        login,
        logout,
        changePassword,
        refreshUser: async () => {
          await refreshUser();
        },
        getRolePath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
