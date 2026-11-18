"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isChat = pathname?.includes("/chat");

  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="flex h-screen overflow-hidden bg-[#edf2f7]">
        <Sidebar role="teacher" />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopBar
            title="Teacher Portal"
            userName={user?.name || "Meera Krishnan"}
            userRole="Faculty • Class X-A"
          />
          <main
            className={`flex-1 w-full min-h-0 ${
              isChat
                ? "px-4 sm:px-6 lg:px-8 py-3 overflow-hidden flex flex-col"
                : "px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
