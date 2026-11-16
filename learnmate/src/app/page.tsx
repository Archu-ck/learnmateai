"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getRolePath } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(getRolePath(user.role));
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to your LearnMate workspace...</p>
      </div>
    </div>
  );
}
