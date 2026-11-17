"use client";

import { useAuth } from "@/context/AuthContext";
import { GraduationCap, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

interface RoleDashboardProps {
  roleTitle: string;
  roleDescription: string;
}

export default function RoleDashboard({ roleTitle, roleDescription }: RoleDashboardProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f0f3f8] font-sans">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-800 leading-none block">LearnMate</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {roleTitle} Portal • Vidya Bharati
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-1 py-1 pr-3 neu-pill bg-[#f0f3f8]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="neu-circle w-10 h-10 text-slate-500 hover:text-rose-600 cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="neu-card p-8 sm:p-9 space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-700 text-xs font-extrabold rounded-full border border-indigo-200/50 uppercase tracking-wide">
              {user?.role}
            </span>
            <span className="text-xs text-slate-400 font-medium">Institution ID: {user?.schoolId || "school-default-01"}</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">{roleDescription}</p>
          </div>

          <div className="neu-inset p-5 space-y-2 text-xs text-slate-600">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Account Roster Profile:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Assigned Role: <strong className="text-slate-800 uppercase">{user?.role}</strong></li>
              <li>Registered Email: <strong className="text-slate-800 font-mono">{user?.email}</strong></li>
              {user?.admissionNo && (
                <li>Admission Number: <strong className="text-slate-800 font-mono">{user.admissionNo}</strong></li>
              )}
              {user?.sectionId && (
                <li>Section: <strong className="text-slate-800">{user.sectionId}</strong></li>
              )}
            </ul>
          </div>

          <div className="neu-card p-5 flex items-start gap-3 bg-gradient-to-br from-indigo-50/60 to-purple-50/60">
            <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-950 leading-relaxed font-medium">
              This is a role placeholder view. As a registered <strong>{user?.role}</strong>, you have access exclusively to your role-authorized workspace. Access to unauthorized modules (including School Admin) is strictly restricted by RBAC rules.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
