"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Lock,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@learnmate.test");
  const [password, setPassword] = useState("AdminPass123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Shield Icon Badge */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 items-center justify-center shadow-lg shadow-slate-900/30 mb-3 group hover:scale-105 transition-transform">
          <ShieldCheck className="w-9 h-9 text-indigo-300" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Admin Portal
        </h1>
        <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
          LearnMate System Administration & Governance
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="neu-card p-7 sm:p-9 space-y-6">
          {/* Restricted Notice & Autofill Badge */}
          <div className="neu-inset p-3.5 space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">
              <ShieldAlert size={14} className="text-indigo-600" />
              <span>Restricted System Gateway</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Default administrator credentials autofilled for development.
            </p>
          </div>

          {error && (
            <div className="neu-inset p-3.5 flex items-center gap-2 text-xs text-rose-700 font-semibold">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Admin Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@learnmate.test"
                  className="neu-input w-full rounded-xl text-xs sm:text-sm font-medium"
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>

            {/* Admin Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Security Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="AdminPass123!"
                  className="neu-input w-full rounded-xl text-xs sm:text-sm font-medium"
                  style={{ paddingLeft: "42px", paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer transition-colors z-10"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="neu-btn-primary w-full py-3.5 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <span>{loading ? "Verifying..." : "Sign In to Admin Console"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Navigation back to standard portal */}
          <div className="pt-5 border-t border-slate-200/80 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Student & Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
