"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { ToastProvider } from "@/components/Toast";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Upload,
  BookOpen,
  Layers,
  UserCheck,
  ShieldAlert,
  History,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users Directory", icon: Users },
  { href: "/admin/users/import", label: "CSV Import", icon: Upload },
  { href: "/admin/classes", label: "Classes & Sections", icon: Layers },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/parents", label: "Parent Links", icon: UserCheck },
  { href: "/admin/roles", label: "Role Permissions", icon: ShieldAlert },
  { href: "/admin/audit", label: "Audit Log", icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50 flex font-sans">
          {/* Left Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            {/* School Branding */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <GraduationCap size={22} />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 leading-none">LearnMate</span>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  School Admin
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* School identifier badge in sidebar footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Institution ID</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.schoolId || "school-default-01"}</p>
            </div>
          </aside>

          {/* Right Main Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">School Administration</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-slate-800">
                  {navItems.find((n) => n.href === pathname)?.label || "Admin"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-right">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{user?.name || "Administrator"}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {user?.name?.charAt(0) || "A"}
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

            {/* Main Content View */}
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </RoleGuard>
  );
}
