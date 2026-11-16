"use client";

import { useAuth } from "@/context/AuthContext";
import { GraduationCap, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";

interface RoleDashboardProps {
  roleTitle: string;
  roleDescription: string;
}

export default function RoleDashboard({ roleTitle, roleDescription }: RoleDashboardProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 leading-none">LearnMate</span>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {roleTitle} Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 uppercase tracking-wide">
              {user?.role}
            </span>
            <span className="text-xs text-slate-400">School ID: {user?.schoolId}</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">{roleDescription}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Account Role Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Assigned Role: <strong className="text-slate-800">{user?.role}</strong></li>
              <li>Account Email: <strong className="text-slate-800">{user?.email}</strong></li>
              {user?.admissionNo && (
                <li>Admission Number: <strong className="text-slate-800">{user.admissionNo}</strong></li>
              )}
              {user?.sectionId && (
                <li>Section: <strong className="text-slate-800">{user.sectionId}</strong></li>
              )}
            </ul>
          </div>

          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3">
            <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-relaxed">
              This is a role placeholder view. As a registered <strong>{user?.role}</strong>, you have access exclusively to your role-authorized workspace. Access to unauthorized modules (including School Admin) is strictly restricted by RBAC rules.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
