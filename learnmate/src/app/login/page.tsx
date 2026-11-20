"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, getRolePath } from "@/context/AuthContext";
import {
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual credentials form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  const handleDirectRoleLogin = async (role: "principal" | "admin") => {
    setError(null);
    setLoggingInRole(role);
    try {
      const email = role === "admin" ? "admin@learnmate.test" : "principal@learnmate.test";
      const pass = role === "admin" ? "AdminPass123!" : "Password123!";
      const user = await login(email, pass);
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(getRolePath(user.role));
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify connection.");
      setLoggingInRole(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setManualLoading(true);
    try {
      const user = await login(manualEmail, manualPassword);
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(getRolePath(user.role));
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="neu-inset p-3.5 flex items-center gap-2.5 text-xs text-rose-700 font-semibold rounded-xl">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Role Portal Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Student Portal Tile -> Opens Student Selection Page */}
        <Link
          href="/login/select?role=student"
          className="neu-card p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-400"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Student Login
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Choose from all 20 Class 10 student profiles to access assignments, doubt solver, and progress.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>Select Student Profile</span>
            <ArrowRight size={15} />
          </div>
        </Link>

        {/* 2. Teacher Portal Tile -> Opens Teacher Selection Page */}
        <Link
          href="/login/select?role=teacher"
          className="neu-card p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-emerald-400"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                Teacher Login
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Choose from all 4 faculty subject teachers for Mathematics, Science, English, and SST.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>Select Teacher Profile</span>
            <ArrowRight size={15} />
          </div>
        </Link>

        {/* 3. Parent Portal Tile -> Opens Parent Selection Page */}
        <Link
          href="/login/select?role=parent"
          className="neu-card p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-amber-400"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 group-hover:text-amber-700 transition-colors">
                Parent Login
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Choose any parent profile to view attendance, report cards, and remarks with student names.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
            <span>Select Parent Profile</span>
            <ArrowRight size={15} />
          </div>
        </Link>

        {/* 4. Principal Portal Tile -> 1-Click Direct Sign In */}
        <button
          type="button"
          disabled={!!loggingInRole}
          onClick={() => handleDirectRoleLogin("principal")}
          className="neu-card p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-purple-400 text-left disabled:opacity-50"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-800 group-hover:text-purple-700 transition-colors">
                  Principal Portal
                </h2>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                  Dr. Ramesh Iyer
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Institutional oversight, student risk alerts, AI executive intelligence, and school metrics.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
            <span>{loggingInRole === "principal" ? "Authenticating..." : "Sign In as Principal"}</span>
            <ArrowRight size={15} />
          </div>
        </button>

        {/* 5. Admin Portal Tile -> 1-Click Direct Sign In */}
        <button
          type="button"
          disabled={!!loggingInRole}
          onClick={() => handleDirectRoleLogin("admin")}
          className="neu-card p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-rose-400 text-left disabled:opacity-50 sm:col-span-2 lg:col-span-1"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-800 group-hover:text-rose-700 transition-colors">
                  Admin Panel
                </h2>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                  Full Control
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                School-wide user provisioning, role permissions, timetable allocations, and audit logs.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:translate-x-1 transition-transform">
            <span>{loggingInRole === "admin" ? "Authenticating..." : "Sign In to Admin Panel"}</span>
            <ArrowRight size={15} />
          </div>
        </button>
      </div>

      {/* Manual Email & Password Collapsible Form */}
      <div className="pt-4">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-2 cursor-pointer mx-auto transition-colors"
        >
          <Lock size={13} />
          <span>{showManualForm ? "Hide manual email & password login" : "Or sign in with custom email & password"}</span>
          {showManualForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showManualForm && (
          <div className="neu-card p-6 rounded-2xl max-w-md mx-auto mt-4 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider text-center">
              Custom Credentials
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="neu-input w-full rounded-xl text-xs font-medium"
                    style={{ paddingLeft: "38px" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Enter password"
                    className="neu-input w-full rounded-xl text-xs font-medium"
                    style={{ paddingLeft: "38px", paddingRight: "38px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={manualLoading}
                className="neu-btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{manualLoading ? "Signing in..." : "Sign In with Credentials"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl text-center mb-8">
        {/* Brand Icon */}
        <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 items-center justify-center shadow-xl shadow-indigo-500/30 mb-3 group hover:scale-105 transition-transform">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          LearnMate LMS
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-500 tracking-wide">
          Select your portal to access Class 10 workspaces, curriculum, and analytics
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <Suspense
          fallback={
            <div className="neu-card p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
              Loading portal gateway...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
