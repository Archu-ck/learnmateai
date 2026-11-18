"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isChatOrAI = pathname?.includes("/chat") || pathname?.includes("/ask-ai");

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="flex h-screen overflow-hidden bg-[#edf2f7]">
        <Sidebar role="student" />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopBar
            title="Student Portal"
            userName={user?.name || "Aarav Sharma"}
            userRole="Class X-A • Student"
          />
          <main
            className={`flex-1 w-full min-h-0 ${
              isChatOrAI
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
