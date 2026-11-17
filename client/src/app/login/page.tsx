"use client";

import { useState } from "react";
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
} from "lucide-react";

interface RolePreset {
  role: string;
  title: string;
  email: string;
  pass: string;
}

const presets: RolePreset[] = [
  { role: "student", title: "Student", email: "student@learnmate.test", pass: "Password123!" },
  { role: "teacher", title: "Teacher", email: "teacher@learnmate.test", pass: "Password123!" },
  { role: "parent", title: "Parent", email: "parent@learnmate.test", pass: "Password123!" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("student@learnmate.test");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectPreset = (p: RolePreset) => {
    setEmail(p.email);
    setPassword(p.pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        const dest = getRolePath(user.role);
        router.push(dest);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/30 mb-3 group hover:scale-105 transition-transform">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          LearnMate LMS
        </h1>
        <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
          School Administration &amp; Portal
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="neu-card p-7 sm:p-9 space-y-6">
          {error && (
            <div className="neu-inset p-3.5 flex items-center gap-2 text-xs text-rose-700 font-semibold">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selection side-by-side ON TOP of credentials */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              Select Portal
            </label>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {presets.map((p) => {
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`py-2 px-2.5 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? "neu-inset text-indigo-700 font-extrabold shadow-inner"
                        : "neu-btn text-slate-700 hover:text-slate-900 font-bold"
                    }`}
                  >
                    <span className="text-xs font-bold block">{p.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  className="neu-input w-full rounded-xl text-xs sm:text-sm font-medium transition-all"
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="neu-input w-full rounded-xl text-xs sm:text-sm font-medium transition-all"
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

            {/* Direct Sign-In Button */}
            <button
              type="submit"
              disabled={loading}
              className="neu-btn-primary w-full py-3.5 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <span>{loading ? "Signing In..." : "Sign In"}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
