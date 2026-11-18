"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
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
  CheckSquare,
  Clock,
  MessageSquare,
  TrendingUp,
  Bot,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navByRole: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: <LayoutDashboard size={19} /> },
    { label: "Ask AI", href: "/student/ask-ai", icon: <Bot size={19} /> },
    { label: "My Subjects", href: "/student/subjects", icon: <BookOpen size={19} /> },
    { label: "Chat Inbox", href: "/student/chat", icon: <MessageSquare size={19} /> },
    { label: "Assignments", href: "/student/assignments", icon: <FileText size={19} /> },
    { label: "Tests", href: "/student/tests", icon: <CheckSquare size={19} /> },
    { label: "Study Planner", href: "/student/planner", icon: <Calendar size={19} /> },
    { label: "Progress", href: "/student/progress", icon: <TrendingUp size={19} /> },
    { label: "Attendance", href: "/student/attendance", icon: <Calendar size={19} /> },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: <LayoutDashboard size={19} /> },
    { label: "Create Assignment", href: "/teacher/assignments/create", icon: <FileText size={19} /> },
    { label: "Smart Assignment Manager", href: "/teacher/assignments", icon: <Sparkles size={19} /> },
    { label: "My Classes", href: "/teacher/classes", icon: <BookOpen size={19} /> },
    { label: "Chat Inbox", href: "/teacher/chat", icon: <MessageSquare size={19} /> },
  ],
  parent: [
    { label: "Dashboard", href: "/parent", icon: <LayoutDashboard size={19} /> },
    { label: "Ward Progress", href: "/student/progress", icon: <TrendingUp size={19} /> },
    { label: "Attendance", href: "/student/attendance", icon: <Calendar size={19} /> },
  ],
  principal: [
    { label: "Dashboard", href: "/principal", icon: <BarChart3 size={19} /> },
    { label: "Classes & Faculty", href: "/admin/classes", icon: <ClipboardList size={19} /> },
    { label: "Subject Allocation", href: "/admin/subject-allocation", icon: <BookOpen size={19} /> },
    { label: "Audit Log", href: "/admin/audit", icon: <FileText size={19} /> },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={19} /> },
    { label: "User Directory", href: "/admin/users", icon: <Users size={19} /> },
    { label: "CSV Import", href: "/admin/users/import", icon: <Settings size={19} /> },
    { label: "Classes & Sections", href: "/admin/classes", icon: <ClipboardList size={19} /> },
    { label: "Subjects", href: "/admin/subjects", icon: <BookOpen size={19} /> },
    { label: "Subject Allocation", href: "/admin/subject-allocation", icon: <BookOpen size={19} /> },
    { label: "Parent Links", href: "/admin/parents", icon: <Users size={19} /> },
    { label: "Role Permissions", href: "/admin/roles", icon: <Settings size={19} /> },
    { label: "Audit Log", href: "/admin/audit", icon: <BarChart3 size={19} /> },
    { label: "AI Usage Logs", href: "/admin/ai-logs", icon: <Bot size={19} /> },
  ],
};

const allRoles = [
  { key: "student", label: "Student Portal", href: "/student", desc: "Aarav Sharma • Class X-A" },
  { key: "teacher", label: "Teacher Portal", href: "/teacher", desc: "Meera Krishnan • Math & Physics" },
  { key: "parent", label: "Parent Portal", href: "/parent", desc: "Sunita Sharma • Parent of Aarav" },
  { key: "principal", label: "Principal Portal", href: "/principal", desc: "Dr. Ramesh Iyer • Leadership" },
  { key: "admin", label: "Admin Portal", href: "/admin", desc: "System Administrator • System Config" },
];

const routeApiMap: Record<string, string[]> = {
  "/student": ["/api/student/dashboard"],
  "/student/ask-ai": ["/api/student/subjects"],
  "/student/subjects": ["/api/student/subjects"],
  "/student/chat": ["/api/chat/threads", "/api/chat/settings"],
  "/student/assignments": ["/api/student/assignments"],
  "/student/tests": ["/api/student/tests"],
  "/student/planner": ["/api/student/planner"],
  "/student/progress": ["/api/student/progress"],
  "/student/attendance": ["/api/student/attendance"],
  "/teacher": ["/api/teacher/dashboard"],
  "/teacher/assignments": ["/api/teacher/classes", "/api/teacher/assignments"],
  "/teacher/assignments/create": ["/api/teacher/classes"],
  "/teacher/classes": ["/api/teacher/classes"],
  "/teacher/chat": ["/api/chat/threads", "/api/chat/settings"],
  "/parent": ["/api/parent/dashboard"],
  "/principal": ["/api/principal/dashboard", "/api/admin/classes"],
  "/admin": ["/api/admin/stats", "/api/admin/dashboard"],
  "/admin/users": ["/api/admin/users?page=1&limit=10"],
  "/admin/classes": ["/api/admin/classes"],
  "/admin/subjects": ["/api/admin/subjects"],
  "/admin/subject-allocation": ["/api/admin/subject-allocation"],
  "/admin/parents": ["/api/admin/parents"],
  "/admin/roles": ["/api/admin/roles"],
  "/admin/audit": ["/api/admin/audit"],
};

function NavList({
  role,
  onItemClick,
}: {
  role: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const items = navByRole[role] || [];

  const handleHover = (href: string) => {
    const endpoints = routeApiMap[href];
    if (endpoints && endpoints.length > 0) {
      api.prefetch(endpoints);
    }
  };

  return (
    <ul className="space-y-2.5">
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
              onMouseEnter={() => handleHover(item.href)}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30 translate-x-1"
                  : "neu-btn text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-500"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.label === "Ask AI" && !isActive && (
                <span className="ml-auto px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 text-[9px] font-black text-white shadow-xs">
                  AI
                </span>
              )}
              {item.label === "Smart Assignment Manager" && !isActive && (
                <span className="ml-auto px-1.5 py-0.5 rounded-md bg-amber-500 text-[9px] font-black text-white shadow-xs">
                  AI
                </span>
              )}
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
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#edf2f7]/95 backdrop-blur-xl border-b border-white/80 w-full fixed top-0 left-0 z-40 shadow-sm">
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
        className={`bg-[#edf2f7] flex flex-col shrink-0 z-50 transition-all md:translate-x-0 border-r border-white/80 shadow-[6px_0_20px_rgba(163,177,198,0.4)] ${
          mobileOpen
            ? "fixed inset-y-0 left-0 w-72 translate-x-0 shadow-2xl"
            : "hidden md:flex md:w-60 lg:w-64 md:min-h-screen"
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
        <nav className="flex-1 py-6 px-4 overflow-y-auto scrollbar-slim">
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

          {/* Mini Promotion / Info Card (Neumorphic) */}
          <div className="mt-8 mx-1 p-4 neu-card-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-400 to-coral-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles size={14} />
              </div>
              <span className="text-xs font-extrabold text-slate-800">Study Assistant</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Need instant step-by-step guidance? AI Tutor is ready to help 24/7.
            </p>
            <div className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 pt-1">
              <span>Vidya Bharati Portal</span>
              <span>→</span>
            </div>
          </div>
        </nav>

        {/* Switch Role Capsule & Sign Out */}
        <div className="p-4 space-y-2 border-t border-white/80">
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
              <div className="absolute bottom-full left-0 mb-2 w-full neu-card p-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
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
                    className={`block px-3 py-2 text-xs rounded-xl transition-all ${
                      r.key === role
                        ? "text-indigo-700 font-bold neu-inset"
                        : "text-slate-700 hover:bg-white/40 font-semibold"
                    }`}
                  >
                    <div className="font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-400 truncate font-medium">{r.desc}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sign out link */}
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
