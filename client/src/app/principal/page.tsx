"use client";

import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function PrincipalPage() {
  const { user } = useAuth();
  const principalName = user?.name || "Dr. Ramesh Iyer";

  return (
    <RoleGuard allowedRoles={["principal"]}>
      <div className="space-y-7 max-w-4xl mx-auto pb-12 font-sans">
        {/* Welcome Hero Banner */}
        <div className="neu-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/25 shrink-0">
              {principalName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200/60 inline-flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Principal Portal</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Institutional Leadership</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Welcome, {principalName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Vidya Bharati Public School • School Leadership Office
              </p>
            </div>
          </div>
        </div>

        {/* Reserved for Future Implementation Card */}
        <div className="neu-card p-8 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-sm">
            <Clock size={32} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Dashboard Reserved for Future Implementation
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              The institutional analytics dashboard (school-wide department performance, board examination statistics, and faculty health) is reserved for upcoming release phases.
            </p>
          </div>

          <div className="neu-inset max-w-lg mx-auto p-4 text-xs text-slate-600 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Leadership Profile Details:</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Your institutional credentials and audit permissions are active. To inspect your administrator details, school ID, or sign out, click on <strong>your name capsule in the top-right corner</strong>.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/change-password"
              className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:text-indigo-600"
            >
              <KeyRound size={14} />
              <span>Change Password</span>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
