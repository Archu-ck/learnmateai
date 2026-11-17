"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getRolePath } from "@/context/AuthContext";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (allowedRoles.includes("admin")) {
          router.push("/admin/login");
        } else {
          router.push("/login");
        }
      } else if (user.mustChangePassword) {
        router.push("/change-password");
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect to user's assigned role dashboard
        router.push(getRolePath(user.role));
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.mustChangePassword || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
