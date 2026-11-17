"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="flex min-h-screen bg-[#edf2f7]">
        <Sidebar role="teacher" />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title="Teacher Portal"
            userName={user?.name || "Meera Krishnan"}
            userRole="Faculty • Class X-A"
          />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
