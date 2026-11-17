"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import RoleGuard from "@/components/RoleGuard";
import { ToastProvider } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // The dedicated admin login page should not be wrapped in RoleGuard or Admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ToastProvider>
        <div className="flex min-h-screen bg-[#edf2f7]">
          <Sidebar role="admin" />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar
              title="Admin Portal"
              userName={user?.name || "System Administrator"}
              userRole="Administrator • System Config"
            />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </RoleGuard>
  );
}
