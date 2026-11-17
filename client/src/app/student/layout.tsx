"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="flex min-h-screen bg-[#edf2f7]">
        <Sidebar role="student" />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title="Student Portal"
            userName={user?.name || "Aarav Sharma"}
            userRole="Class X-A • Student"
          />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
