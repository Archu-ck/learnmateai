"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface RolePreset {
  role: string;
  title: string;
  subtitle: string;
  email: string;
  pass: string;
  icon: any;
  badge: string;
}

const presets: RolePreset[] = [
  {
    role: "student",
    title: "Student",
    subtitle: "Aarav Sharma",
    email: "student@learnmate.test",
    pass: "Password123!",
    icon: GraduationCap,
    badge: "Class 10-A",
  },
  {
    role: "teacher",
    title: "Teacher",
    subtitle: "Meera Krishnan",
    email: "teacher@learnmate.test",
    pass: "Password123!",
    icon: BookOpen,
    badge: "Class Mentor",
  },
  {
    role: "parent",
    title: "Parent",
    subtitle: "Rajesh Sharma",
    email: "parent@learnmate.test",
    pass: "Password123!",
    icon: Users,
    badge: "Guardian",
  },
  {
    role: "principal",
    title: "Principal",
    subtitle: "Dr. Ramesh Iyer",
    email: "principal@learnmate.test",
    pass: "Password123!",
    icon: BarChart3,
    badge: "Leadership",
  },
  {
    role: "admin",
    title: "Admin Panel",
    subtitle: "System Administrator",
    email: "admin@learnmate.test",
    pass: "AdminPass123!",
    icon: ShieldCheck,
    badge: "Master Console",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const initialRoleParam = searchParams.get("role");
  const initialPreset = presets.find((p) => p.role === initialRoleParam) || presets[0];

  const [selectedRole, setSelectedRole] = useState<string>(initialPreset.role);
  const [email, setEmail] = useState<string>(initialPreset.email);
  const [password, setPassword] = useState<string>(initialPreset.pass);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRoleParam) {
      const matched = presets.find((p) => p.role === initialRoleParam);
      if (matched) {
        setSelectedRole(matched.role);
        setEmail(matched.email);
        setPassword(matched.pass);
      }
    }
  }, [initialRoleParam]);

  const selectPreset = (p: RolePreset) => {
    setSelectedRole(p.role);
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
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const activePreset = presets.find((p) => p.role === selectedRole) || presets[0];

  return (
    <div className="neu-card p-7 sm:p-9 space-y-6">
      {error && (
        <div className="neu-inset p-3.5 flex items-center gap-2.5 text-xs text-rose-700 font-semibold rounded-xl">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Select Portal Account
          </label>
          <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
            <Sparkles size={11} />
            <span>1-Click Autofill</span>
          </span>
        </div>

        {/* 5 Role Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presets.slice(0, 3).map((p) => {
            const isSelected = selectedRole === p.role;
            const Icon = p.icon;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => selectPreset(p)}
                className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? "neu-inset text-indigo-700 font-extrabold shadow-inner"
                    : "neu-btn text-slate-700 hover:text-slate-900 font-bold"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div className="truncate">
                  <span className="text-xs font-extrabold block leading-tight">{p.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium block truncate">
                    {p.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Leadership & Admin Options Row */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {presets.slice(3).map((p) => {
            const isSelected = selectedRole === p.role;
            const Icon = p.icon;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => selectPreset(p)}
                className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? "neu-inset text-indigo-700 font-extrabold shadow-inner"
                    : "neu-btn text-slate-700 hover:text-slate-900 font-bold"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? p.role === "admin"
                        ? "bg-slate-800 text-amber-400"
                        : "bg-amber-500 text-white"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold block leading-tight">{p.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        p.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block truncate">
                    {p.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Account Info Capsule */}
      <div className="neu-inset p-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="font-bold text-slate-700">Ready to sign in as</span>
          <span className="font-extrabold text-indigo-700">{activePreset.title}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {activePreset.subtitle}
        </span>
      </div>

      {/* Credentials Form */}
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

        {/* Sign-In Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="neu-btn-primary w-full py-3.5 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
        >
          <span>
            {loading
              ? "Authenticating..."
              : `Sign In to ${activePreset.title}`}
          </span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        {/* Brand Icon */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/30 mb-3 group hover:scale-105 transition-transform">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          LearnMate LMS
        </h1>
        <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Unified Institutional &amp; Academic Gateway
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg">
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
