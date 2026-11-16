"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f0f3f8]">
      <Sidebar role="teacher" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Teacher Portal" userName="Meera Krishnan" userRole="Faculty • Class X-A" />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
