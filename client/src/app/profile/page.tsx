"use client";

import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useAuth, getRolePath } from "@/context/AuthContext";
import {
  User,
  Mail,
  ShieldCheck,
  School,
  CheckCircle2,
  Hash,
  Layers,
  Users,
  KeyRound,
  ArrowLeft,
  LogOut,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role || "student";
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "U";

  // Build only the necessary, relevant information based on the user's role
  const getRoleSpecificItems = () => {
    switch (role) {
      case "student":
        return [
          {
            label: "Full Student Name",
            category: "Identity",
            value: user.name,
            icon: User,
            color: "text-indigo-600 bg-indigo-500/10 border-indigo-200/50",
          },
          {
            label: "Student Email",
            category: "Account",
            value: user.email,
            icon: Mail,
            color: "text-sky-600 bg-sky-500/10 border-sky-200/50",
            mono: true,
          },
          {
            label: "Class & Section",
            category: "Enrollment",
            value: user.sectionId || "Class X-A",
            icon: Layers,
            color: "text-purple-600 bg-purple-500/10 border-purple-200/50",
          },
          {
            label: "Admission Number",
            category: "Student ID",
            value: user.admissionNo || "ADM-2026-104",
            icon: Hash,
            color: "text-amber-600 bg-amber-500/10 border-amber-200/50",
            mono: true,
          },
          {
            label: "School / Campus",
            category: "Institution",
            value: "Vidya Bharati Public School",
            icon: School,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
          },
          {
            label: "Enrollment Status",
            category: "Standing",
            value: "Active Student",
            icon: CheckCircle2,
            color: "text-teal-600 bg-teal-500/10 border-teal-200/50",
            status: true,
          },
        ];

      case "teacher":
        return [
          {
            label: "Faculty Name",
            category: "Identity",
            value: user.name,
            icon: User,
            color: "text-purple-600 bg-purple-500/10 border-purple-200/50",
          },
          {
            label: "Official Email",
            category: "Communication",
            value: user.email,
            icon: Mail,
            color: "text-sky-600 bg-sky-500/10 border-sky-200/50",
            mono: true,
          },
          {
            label: "Teaching Department",
            category: "Faculty",
            value: "Mathematics & Physics",
            icon: BookOpen,
            color: "text-indigo-600 bg-indigo-500/10 border-indigo-200/50",
          },
          {
            label: "Assigned Classes",
            category: "Schedule",
            value: "Class X-A & VIII-B",
            icon: Layers,
            color: "text-amber-600 bg-amber-500/10 border-amber-200/50",
          },
          {
            label: "School / Campus",
            category: "Institution",
            value: "Vidya Bharati Public School",
            icon: School,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
          },
          {
            label: "Faculty Status",
            category: "Standing",
            value: "Active Faculty Member",
            icon: CheckCircle2,
            color: "text-teal-600 bg-teal-500/10 border-teal-200/50",
            status: true,
          },
        ];

      case "parent":
        return [
          {
            label: "Parent / Guardian Name",
            category: "Identity",
            value: user.name,
            icon: User,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
          },
          {
            label: "Contact Email",
            category: "Communication",
            value: user.email,
            icon: Mail,
            color: "text-sky-600 bg-sky-500/10 border-sky-200/50",
            mono: true,
          },
          {
            label: "Enrolled Ward (Child)",
            category: "Student Link",
            value: "Aarav Sharma • Class X-A",
            icon: Users,
            color: "text-indigo-600 bg-indigo-500/10 border-indigo-200/50",
          },
          {
            label: "Guardian Role",
            category: "Family Role",
            value: "Primary Guardian / Parent",
            icon: ShieldCheck,
            color: "text-purple-600 bg-purple-500/10 border-purple-200/50",
          },
          {
            label: "School / Campus",
            category: "Institution",
            value: "Vidya Bharati Public School",
            icon: School,
            color: "text-teal-600 bg-teal-500/10 border-teal-200/50",
          },
          {
            label: "Guardian Status",
            category: "Standing",
            value: "Active Guardian",
            icon: CheckCircle2,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
            status: true,
          },
        ];

      case "principal":
        return [
          {
            label: "Executive Name",
            category: "Identity",
            value: user.name,
            icon: User,
            color: "text-amber-600 bg-amber-500/10 border-amber-200/50",
          },
          {
            label: "Leadership Email",
            category: "Official Contact",
            value: user.email,
            icon: Mail,
            color: "text-sky-600 bg-sky-500/10 border-sky-200/50",
            mono: true,
          },
          {
            label: "Administrative Title",
            category: "Leadership",
            value: "Principal & Head of School",
            icon: Award,
            color: "text-purple-600 bg-purple-500/10 border-purple-200/50",
          },
          {
            label: "Executive Scope",
            category: "Oversight",
            value: "Academic & Operational Leadership",
            icon: ShieldCheck,
            color: "text-indigo-600 bg-indigo-500/10 border-indigo-200/50",
          },
          {
            label: "Institution Campus",
            category: "Institution",
            value: "Vidya Bharati Public School",
            icon: School,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
          },
          {
            label: "Account Status",
            category: "Standing",
            value: "Active Institutional Head",
            icon: CheckCircle2,
            color: "text-teal-600 bg-teal-500/10 border-teal-200/50",
            status: true,
          },
        ];

      case "admin":
      default:
        return [
          {
            label: "Administrator Name",
            category: "Identity",
            value: user.name,
            icon: User,
            color: "text-indigo-600 bg-indigo-500/10 border-indigo-200/50",
          },
          {
            label: "System Email",
            category: "Admin Contact",
            value: user.email,
            icon: Mail,
            color: "text-sky-600 bg-sky-500/10 border-sky-200/50",
            mono: true,
          },
          {
            label: "Administrative Role",
            category: "System Role",
            value: "School System Administrator",
            icon: ShieldCheck,
            color: "text-purple-600 bg-purple-500/10 border-purple-200/50",
          },
          {
            label: "Management Scope",
            category: "Control",
            value: "User Directory, Roles, Classes & Roster",
            icon: Layers,
            color: "text-amber-600 bg-amber-500/10 border-amber-200/50",
          },
          {
            label: "Campus / School",
            category: "Institution",
            value: "Vidya Bharati Public School",
            icon: School,
            color: "text-emerald-600 bg-emerald-500/10 border-emerald-200/50",
          },
          {
            label: "Account Status",
            category: "Standing",
            value: "Active System Administrator",
            icon: CheckCircle2,
            color: "text-teal-600 bg-teal-500/10 border-teal-200/50",
            status: true,
          },
        ];
    }
  };

  const essentialItems = getRoleSpecificItems();

  return (
    <RoleGuard allowedRoles={["admin", "principal", "teacher", "student", "parent"]}>
      <div className="flex min-h-screen bg-[#f0f3f8]">
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title="Profile Details"
            userName={user.name}
            userRole={`${role.toUpperCase()} • LearnMate`}
          />

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full">
            <div className="space-y-7 max-w-5xl mx-auto pb-12 font-sans">
              {/* Top Navigation */}
              <div className="flex items-center justify-between">
                <Link
                  href={getRolePath(role)}
                  className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={15} />
                  <span>Back to {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</span>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200/60 inline-flex items-center gap-1.5 shadow-xs">
                    <Sparkles size={12} className="text-indigo-500" />
                    <span className="capitalize">{role} Roster Profile</span>
                  </span>
                </div>
              </div>

              {/* Profile Hero Header Card */}
              <div className="neu-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl shadow-indigo-500/25 shrink-0">
                    {initials}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                        {user.name}
                      </h1>
                      <span className="px-3 py-0.5 rounded-lg text-xs font-extrabold bg-indigo-500/10 text-indigo-700 border border-indigo-200/50 uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      {user.email} • Vidya Bharati Public School
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href="/change-password"
                    className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound size={15} />
                    <span>Change Password</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Section Header */}
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Essential Details
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Key identity and academic roster parameters for this account.
                </p>
              </div>

              {/* Only Necessary Info in GRID FORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {essentialItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="neu-card p-5 space-y-3 flex flex-col justify-between hover:translate-y-[-2px] transition-transform"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${item.color}`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                        <p
                          className={`text-sm sm:text-base font-extrabold text-slate-800 break-words ${
                            item.mono ? "font-mono" : ""
                          }`}
                        >
                          {item.value}
                        </p>
                      </div>

                      {item.status && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Status Verified</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
