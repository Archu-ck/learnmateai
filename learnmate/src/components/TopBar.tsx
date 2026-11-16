"use client";

import { Bell, Search, Sparkles } from "lucide-react";

export default function TopBar({
  title,
  userName = "Aarav Sharma",
  userRole = "Student",
}: {
  title: string;
  userName?: string;
  userRole?: string;
}) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="h-20 bg-transparent flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 mt-12 md:mt-0">
      {/* Title / Current View */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Vidya Bharati School Portal
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Neumorphic Inset Search Bar (matching reference Image 1) */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="neu-input pl-11 pr-5 py-2.5 text-xs sm:text-sm w-44 lg:w-64 rounded-full transition-all focus:w-72"
          />
        </div>

        {/* AI Quick Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 neu-pill text-xs font-semibold text-indigo-600 bg-[#f0f3f8]">
          <Sparkles size={13} className="text-indigo-500" />
          <span>Semester 1 • Active</span>
        </div>

        {/* Neumorphic Circular Notification Button */}
        <button
          className="relative neu-circle w-10 h-10 text-slate-600 hover:text-indigo-600 cursor-pointer"
          aria-label="3 new notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
            3
          </span>
        </button>

        {/* User Profile Capsule */}
        <div className="flex items-center gap-3 pl-1 py-1 pr-3 neu-pill bg-[#f0f3f8]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {userName}
            </p>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
