"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f0f3f8]">
      <Sidebar role="parent" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Parent Portal" userName="Sunita Sharma" userRole="Parent • Aarav Sharma" />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
