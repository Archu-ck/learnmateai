"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
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
  Sparkles,
} from "lucide-react";

interface RolePreset {
  role: string;
  title: string;
  email: string;
  pass: string;
  icon: any;
}

const presets: RolePreset[] = [
  {
    role: "student",
    title: "Student",
    email: "student@learnmate.test",
    pass: "Password123!",
    icon: GraduationCap,
  },
  {
    role: "teacher",
    title: "Teacher",
    email: "teacher@learnmate.test",
    pass: "Password123!",
    icon: BookOpen,
  },
  {
    role: "parent",
    title: "Parent",
    email: "parent@learnmate.test",
    pass: "Password123!",
    icon: Users,
  },
  {
    role: "principal",
    title: "Principal",
    email: "principal@learnmate.test",
    pass: "Password123!",
    icon: BarChart3,
  },
  {
    role: "admin",
    title: "Admin Panel",
    email: "admin@learnmate.test",
    pass: "AdminPass123!",
    icon: ShieldCheck,
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
    // If user clicks Student, Teacher, or Parent role button, immediately open their dedicated tiles page!
    if (p.role === "student") {
      router.push("/login/select?role=student");
      return;
    }
    if (p.role === "teacher") {
      router.push("/login/select?role=teacher");
      return;
    }
    if (p.role === "parent") {
      router.push("/login/select?role=parent");
      return;
    }

    setSelectedRole(p.role);
    setEmail(p.email);
    setPassword(p.pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If default student/teacher/parent email is present, guide them to the tiles page to choose their identity!
    if (selectedRole === "student" && email === "student@learnmate.test") {
      router.push("/login/select?role=student");
      return;
    }
    if (selectedRole === "teacher" && email === "teacher@learnmate.test") {
      router.push("/login/select?role=teacher");
      return;
    }
    if (selectedRole === "parent" && email === "parent@learnmate.test") {
      router.push("/login/select?role=parent");
      return;
    }

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

      {/* Role Selection Buttons (5 Role Names Only) */}
      <div>
        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2.5">
          Select Role
        </label>

        {/* Clean 5-Role Responsive Grid with Role Names Only */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {presets.map((p) => {
            const isSelected = selectedRole === p.role;
            const Icon = p.icon;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => selectPreset(p)}
                className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
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
                <span className="text-xs font-bold leading-tight block">{p.title}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Helper Link for Student, Teacher, or Parent Tile Selection */}
        {selectedRole === "student" && (
          <div className="mt-3 text-right">
            <Link
              href="/login/select?role=student"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Choose from 20 Class 10 Student Tiles</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {selectedRole === "teacher" && (
          <div className="mt-3 text-right">
            <Link
              href="/login/select?role=teacher"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Choose from 4 Faculty Teacher Tiles</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {selectedRole === "parent" && (
          <div className="mt-3 text-right">
            <Link
              href="/login/select?role=parent"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Choose from Parent Tiles (with student names)</span>
              <span>→</span>
            </Link>
          </div>
        )}
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
              : selectedRole === "student" && email === "student@learnmate.test"
              ? "Choose from 20 Student Tiles"
              : selectedRole === "teacher" && email === "teacher@learnmate.test"
              ? "Choose from 4 Faculty Teacher Tiles"
              : selectedRole === "parent" && email === "parent@learnmate.test"
              ? "Choose from Parent Tiles"
              : `Sign In as ${activePreset.title}`}
          </span>
          <ArrowRight size={16} />
        </button>
      </form>

      {/* Direct Tile Selector Footer Link */}
      <div className="pt-2 text-center border-t border-slate-200/60">
        <Link
          href="/login/select"
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={13} className="text-amber-500" />
          <span>Open Tile Selector (Students, Teachers &amp; Parents) →</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
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

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl">
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
