"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["principal"]}>
      <div className="flex min-h-screen bg-[#f0f3f8]">
        <Sidebar role="principal" />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title="Principal Dashboard"
            userName={user?.name || "Dr. Ramesh Iyer"}
            userRole="Principal • Administration"
          />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
