"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  GraduationCap,
  ChevronDown,
  Menu,
  X,
  BookOpen,
  Sparkles,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navByRole: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard size={19} /> },
    { label: "Assignments", href: "/student/assignments", icon: <FileText size={19} /> },
    { label: "Study Planner", href: "/student/planner", icon: <Calendar size={19} /> },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: <LayoutDashboard size={19} /> },
    { label: "Workload View", href: "/teacher/workload", icon: <ClipboardList size={19} /> },
    { label: "Student Profile", href: "/teacher/student/1", icon: <Users size={19} /> },
  ],
  parent: [
    { label: "Child Overview", href: "/parent", icon: <LayoutDashboard size={19} /> },
  ],
  principal: [
    { label: "School Overview", href: "/principal", icon: <BarChart3 size={19} /> },
  ],
  admin: [
    { label: "User Directory", href: "/admin", icon: <Settings size={19} /> },
  ],
};

const allRoles = [
  { key: "student", label: "Student Portal", href: "/student", desc: "Aarav Sharma • Class X-A" },
  { key: "teacher", label: "Teacher Portal", href: "/teacher", desc: "Meera Krishnan • Math & Physics" },
  { key: "parent", label: "Parent Portal", href: "/parent", desc: "Sunita Sharma • Parent of Aarav" },
  { key: "principal", label: "Principal Portal", href: "/principal", desc: "Dr. Ramesh Iyer • Leadership" },
  { key: "admin", label: "Admin Portal", href: "/admin", desc: "Rajesh Kumar • System Config" },
];

function NavList({
  role,
  onItemClick,
}: {
  role: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const items = navByRole[role] || [];

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const isActive =
          item.href === `/${role}`
            ? pathname === item.href
            : pathname?.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 translate-x-1"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 neu-btn"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-500"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Sidebar({ role }: { role: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#f0f3f8]/90 backdrop-blur-xl border-b border-white/60 w-full fixed top-0 left-0 z-40">
        <Link href="/login" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/25">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-base font-extrabold text-slate-800 tracking-tight">
            LearnMate
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="neu-circle w-10 h-10 text-slate-600 cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`bg-[#f0f3f8] flex flex-col shrink-0 z-50 transition-all md:translate-x-0 border-r border-white/80 ${
          mobileOpen
            ? "fixed inset-y-0 left-0 w-72 translate-x-0 shadow-2xl"
            : "hidden md:flex md:w-64 md:min-h-screen"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 pt-2">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-800 tracking-tight block">
                LearnMate
              </span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-1">
                LMS &amp; Academics
              </span>
            </div>
          </Link>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden neu-circle w-8 h-8 text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-6 px-4 overflow-y-auto">
          <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Navigation
          </p>
          <Suspense
            fallback={
              <div className="py-2 px-3 text-xs text-slate-400">Loading menu...</div>
            }
          >
            <NavList role={role} onItemClick={() => setMobileOpen(false)} />
          </Suspense>

          {/* Mini Promotion / Info Card (Inspired by Educame's bottom card in reference Image 2) */}
          <div className="mt-8 mx-1 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white/80 to-purple-50/80 border border-white/90 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-coral-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles size={14} />
              </div>
              <span className="text-xs font-bold text-slate-800">Study Assistant</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Need instant step-by-step guidance? AI Tutor is ready to help 24/7.
            </p>
            <div className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
              <span>Class X-A Syllabus</span>
              <span>→</span>
            </div>
          </div>
        </nav>

        {/* Switch Role Capsule & Sign Out */}
        <div className="p-4 space-y-2 border-t border-white/60">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 neu-btn"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="capitalize">{role} Portal</span>
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 py-2 z-50">
                <div className="px-4 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Switch Portal
                </div>
                {allRoles.map((r) => (
                  <Link
                    key={r.key}
                    href={r.href}
                    onClick={() => {
                      setShowRoleMenu(false);
                      setMobileOpen(false);
                    }}
                    className={`block px-4 py-2 text-xs rounded-xl mx-1.5 transition-colors ${
                      r.key === role
                        ? "text-indigo-700 font-bold bg-indigo-50/80"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.desc}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sign out link */}
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-500 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
