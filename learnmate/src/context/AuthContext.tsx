"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "principal" | "teacher" | "student" | "parent" | string;
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
    default:
      return "/login";
  }
}

export function prefetchRoleData(role: string) {
  if (typeof window === "undefined" || !role) return;

  const roleEndpoints: Record<string, string[]> = {
    student: [
      "/api/student/dashboard",
      "/api/student/subjects",
      "/api/student/assignments",
      "/api/student/tests",
      "/api/student/planner",
      "/api/student/progress",
      "/api/student/attendance",
      "/api/chat/threads",
      "/api/chat/settings",
      "/api/ai/doubt/conversations",
      "/api/notifications",
    ],
    teacher: [
      "/api/teacher/dashboard",
      "/api/teacher/classes",
      "/api/teacher/assignments",
      "/api/teacher/workload",
      "/api/chat/threads",
      "/api/chat/settings",
      "/api/teacher/questions",
      "/api/notifications",
    ],
    parent: [
      "/api/parent/dashboard",
      "/api/student/progress",
      "/api/student/attendance",
      "/api/notifications",
    ],
    principal: [
      "/api/principal/dashboard",
      "/api/admin/classes",
      "/api/admin/subject-allocation",
      "/api/admin/audit",
      "/api/notifications",
    ],
    admin: [
      "/api/admin/stats",
      "/api/admin/dashboard",
      "/api/admin/users?page=1&limit=10",
      "/api/admin/classes",
      "/api/admin/subjects",
      "/api/admin/parents",
      "/api/admin/roles",
      "/api/notifications",
    ],
  };

  const endpoints = roleEndpoints[role] || [];
  if (endpoints.length > 0) {
    const trigger = async () => {
      // 1. Prefetch tier-1 endpoints in parallel
      await api.prefetch(endpoints);

      // 2. Cascade prefetch deep sub-resources silently
      if (role === "student") {
        try {
          const subsRes = api.getCached<{ subjects: any[] }>("/api/student/subjects");
          if (subsRes?.subjects?.length) {
            const subDetailUrls = subsRes.subjects.map((s) => `/api/student/subjects/${s.id}`);
            api.prefetch(subDetailUrls);
          }
          const threadsRes = api.getCached<{ threads: any[] }>("/api/chat/threads");
          if (threadsRes?.threads?.length) {
            api.prefetch(`/api/chat/thread?threadId=${threadsRes.threads[0]._id}`);
          }
        } catch {}
      } else if (role === "teacher") {
        try {
          const classesRes = api.getCached<{ classes: any[] }>("/api/teacher/classes");
          if (classesRes?.classes?.length) {
            const classUrls = classesRes.classes.flatMap((c) => [
              `/api/teacher/assignments?classId=${c.classId}&section=${c.section}`,
              `/api/teacher/workload/calendar?classId=${c.classId}&section=${c.section}`,
              `/api/teacher/classes/${c.id || c._id}`,
            ]);
            api.prefetch(classUrls);
          }
          const threadsRes = api.getCached<{ threads: any[] }>("/api/chat/threads");
          if (threadsRes?.threads?.length) {
            api.prefetch(`/api/chat/thread?threadId=${threadsRes.threads[0]._id}`);
          }
        } catch {}
      }
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(trigger);
    } else {
      setTimeout(trigger, 100);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    // If on localhost / local IP, check if this tab has an active session in sessionStorage.
    // When opening a new tab, sessionStorage is empty, so we deliberately do NOT auto-login from shared browser cookies.
    // This ensures opening a new tab always opens clean /login for easy presentation!
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local");

      const hasTabSession = !!window.sessionStorage.getItem("learnmate_token");

      if (isLocalhost && !hasTabSession) {
        setUser(null);
        setPermissions([]);
        setLoading(false);
        return null;
      }
    }

    try {
      const res = await api.get<{ user: User; permissions: string[] }>("/api/auth/me");
      setUser(res.user);
      setPermissions(res.permissions || []);
      if (res.user?.role) {
        prefetchRoleData(res.user.role);
      }
      return res.user;
    } catch (err: any) {
      setUser(null);
      setPermissions([]);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("learnmate_token");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ user: User; permissions: string[]; token?: string }>("/api/auth/login", {
      email,
      password,
    });

    if (typeof window !== "undefined" && res.token) {
      window.sessionStorage.setItem("learnmate_token", res.token);
    }

    setUser(res.user);
    setPermissions(res.permissions || []);

    if (res.user?.role) {
      prefetchRoleData(res.user.role);
    }

    if (res.user.mustChangePassword) {
      router.push("/change-password");
    } else {
      router.push(getRolePath(res.user.role));
    }

    return res.user;
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("learnmate_token");
    }
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // Continue even if call fails
    }
    api.clearCache();
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
