"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, ArrowRight, AlertCircle, Lock, Mail } from "lucide-react";

type RolePreset = {
  role: string;
  email: string;
  pass: string;
  title: string;
  badge: string;
};

const presets: RolePreset[] = [
  { role: "admin", email: "admin@learnmate.test", pass: "AdminPass123!", title: "Admin", badge: "Full Access" },
  { role: "teacher", email: "teacher@learnmate.test", pass: "Password123!", title: "Teacher", badge: "Faculty" },
  { role: "student", email: "student@learnmate.test", pass: "Password123!", title: "Student", badge: "Learner" },
  { role: "parent", email: "parent@learnmate.test", pass: "Password123!", title: "Parent", badge: "Guardian" },
  { role: "principal", email: "principal@learnmate.test", pass: "Password123!", title: "Principal", badge: "Leadership" },
  { role: "coordinator", email: "coordinator@learnmate.test", pass: "Password123!", title: "Coordinator", badge: "Academic" },
  { role: "counsellor", email: "counsellor@learnmate.test", pass: "Password123!", title: "Counsellor", badge: "Student Care" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@learnmate.test");
  const [password, setPassword] = useState("AdminPass123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (p: RolePreset) => {
    setEmail(p.email);
    setPassword(p.pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-600/20 mb-3">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LearnMate LMS</h1>
        <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          School Administration &amp; Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Role Presets for Rapid Demo Testing */}
          <div className="pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Demo Logins (One-Click Fill)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {presets.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className={`py-1.5 px-2 rounded-lg text-left border transition-all ${
                    email === p.email
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <p className="text-[11px] leading-tight font-medium">{p.title}</p>
                  <p className="text-[9px] text-slate-400 truncate">{p.badge}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
