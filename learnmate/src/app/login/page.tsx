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
  Search,
  CheckCircle2,
  UserCheck,
  Sparkles,
} from "lucide-react";

interface StudentItem {
  name: string;
  email: string;
  adm: string;
  roll: string;
  sec: "A" | "B";
}

interface TeacherItem {
  name: string;
  email: string;
  subject: string;
  classes: string;
  tag: string;
}

interface ParentItem {
  name: string;
  email: string;
  studentName: string;
  className: string;
}

const students: StudentItem[] = [
  // Section A
  { name: "Aarav Sharma", email: "student@learnmate.test", adm: "ADM-10A-001", roll: "1", sec: "A" },
  { name: "Ananya Patel", email: "ananya.p@learnmate.test", adm: "ADM-10A-002", roll: "2", sec: "A" },
  { name: "Rohan Gupta", email: "rohan.g@learnmate.test", adm: "ADM-10A-003", roll: "3", sec: "A" },
  { name: "Priya Nair", email: "priya.n@learnmate.test", adm: "ADM-10A-004", roll: "4", sec: "A" },
  { name: "Kabir Singh", email: "kabir.s@learnmate.test", adm: "ADM-10A-005", roll: "5", sec: "A" },
  { name: "Sneha Roy", email: "sneha.r@learnmate.test", adm: "ADM-10A-006", roll: "6", sec: "A" },
  { name: "Aditya Verma", email: "aditya.v@learnmate.test", adm: "ADM-10A-007", roll: "7", sec: "A" },
  { name: "Diya Sen", email: "diya.s@learnmate.test", adm: "ADM-10A-008", roll: "8", sec: "A" },
  { name: "Yash Joshi", email: "yash.j@learnmate.test", adm: "ADM-10A-009", roll: "9", sec: "A" },
  { name: "Riya Mukherjee", email: "riya.m@learnmate.test", adm: "ADM-10A-010", roll: "10", sec: "A" },

  // Section B
  { name: "Devansh Verma", email: "devansh.v@learnmate.test", adm: "ADM-10B-011", roll: "1", sec: "B" },
  { name: "Tanvi Rao", email: "tanvi.r@learnmate.test", adm: "ADM-10B-012", roll: "2", sec: "B" },
  { name: "Siddharth Mehta", email: "siddharth.m@learnmate.test", adm: "ADM-10B-013", roll: "3", sec: "B" },
  { name: "Pooja Hegde", email: "pooja.h@learnmate.test", adm: "ADM-10B-014", roll: "4", sec: "B" },
  { name: "Varun Kapoor", email: "varun.k@learnmate.test", adm: "ADM-10B-015", roll: "5", sec: "B" },
  { name: "Ishita Bhatt", email: "ishita.b@learnmate.test", adm: "ADM-10B-016", roll: "6", sec: "B" },
  { name: "Aryan Saxena", email: "aryan.s@learnmate.test", adm: "ADM-10B-017", roll: "7", sec: "B" },
  { name: "Kriti Malhotra", email: "kriti.m@learnmate.test", adm: "ADM-10B-018", roll: "8", sec: "B" },
  { name: "Rahul Deshmukh", email: "rahul.d@learnmate.test", adm: "ADM-10B-019", roll: "9", sec: "B" },
  { name: "Simran Kaur", email: "simran.k@learnmate.test", adm: "ADM-10B-020", roll: "10", sec: "B" },
];

const teachers: TeacherItem[] = [
  {
    name: "Meera Krishnan",
    email: "teacher@learnmate.test",
    subject: "Mathematics (MATH10)",
    classes: "Class 10-A, Class 10-B",
    tag: "Class Teacher • 10-A",
  },
  {
    name: "Dr. Vikram Sharma",
    email: "vikram.sharma@learnmate.test",
    subject: "Science (SCI10)",
    classes: "Class 10-A, Class 10-B",
    tag: "Class Teacher • 10-B",
  },
  {
    name: "Sunita Menon",
    email: "sunita.menon@learnmate.test",
    subject: "English Language & Literature (ENG10)",
    classes: "Class 10-A, Class 10-B",
    tag: "English Dept Lead",
  },
  {
    name: "Rajiv Tandon",
    email: "rajiv.tandon@learnmate.test",
    subject: "Social Science (SST10)",
    classes: "Class 10-A, Class 10-B",
    tag: "Social Science Lead",
  },
];

const parents: ParentItem[] = [
  {
    name: "Anand Sharma",
    email: "parent@learnmate.test",
    studentName: "Aarav Sharma",
    className: "Class 10-A • Roll 1",
  },
  {
    name: "Priya Patel",
    email: "parent.ananya@learnmate.test",
    studentName: "Ananya Patel",
    className: "Class 10-A • Roll 2",
  },
  {
    name: "Rajesh Gupta",
    email: "parent.rohan@learnmate.test",
    studentName: "Rohan Gupta",
    className: "Class 10-A • Roll 3",
  },
  {
    name: "Sunita Verma",
    email: "parent.devansh@learnmate.test",
    studentName: "Devansh Verma",
    className: "Class 10-B • Roll 1",
  },
];

const ROLES = [
  { key: "student", label: "Student", icon: GraduationCap },
  { key: "teacher", label: "Teacher", icon: BookOpen },
  { key: "parent", label: "Parent", icon: Users },
  { key: "principal", label: "Principal", icon: BarChart3 },
  { key: "admin", label: "Admin Panel", icon: ShieldCheck },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const roleParam = searchParams.get("role") as RoleKey | null;
  const [selectedRole, setSelectedRole] = useState<RoleKey>(
    roleParam && ROLES.some((r) => r.key === roleParam) ? roleParam : "student"
  );

  const [studentSearch, setStudentSearch] = useState("");
  const [studentSecFilter, setStudentSecFilter] = useState<"ALL" | "A" | "B">("ALL");
  const [loggingInEmail, setLoggingInEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual credentials form state
  const [showCustomLogin, setShowCustomLogin] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (roleParam && ROLES.some((r) => r.key === roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const handle1ClickLogin = async (email: string, defaultPass = "Password123!") => {
    setError(null);
    setLoggingInEmail(email);
    try {
      const user = await login(email, defaultPass);
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(getRolePath(user.role));
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify connection.");
      setLoggingInEmail(null);
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

  const filteredStudents = students.filter((s) => {
    const matchesSec = studentSecFilter === "ALL" || s.sec === studentSecFilter;
    const q = studentSearch.toLowerCase();
    const matchesQ =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.adm.toLowerCase().includes(q) ||
      s.roll.includes(q);
    return matchesSec && matchesQ;
  });

  return (
    <div className="neu-card p-6 sm:p-8 space-y-6">
      {error && (
        <div className="neu-inset p-3.5 flex items-center gap-2.5 text-xs text-rose-700 font-semibold rounded-xl">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Tabs */}
      <div>
        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2.5">
          Select Role
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {ROLES.map((r) => {
            const isSelected = selectedRole === r.key;
            const Icon = r.icon;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setSelectedRole(r.key);
                  setError(null);
                }}
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
                <span className="text-xs font-bold leading-tight block">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ROLE PANELS WITH ALL NAMES TO CHOOSE FROM */}

      {/* 1. STUDENT PANEL: Shows all 20 Students */}
      {selectedRole === "student" && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Choose Student Account</h3>
              <p className="text-xs text-slate-400 font-medium">
                Click any student below to log in directly into their Class 10 portal.
              </p>
            </div>

            {/* Section Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
              {(["ALL", "A", "B"] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setStudentSecFilter(sec)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    studentSecFilter === sec
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {sec === "ALL" ? "All (20)" : `Sec ${sec} (10)`}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Filter by student name, roll number, or admission ID..."
              className="neu-input !pl-9 pr-3 py-2 text-xs w-full font-medium rounded-xl"
            />
          </div>

          {/* Students Scrollable Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-slim">
            {filteredStudents.map((st) => {
              const isLoggingIn = loggingInEmail === st.email;
              return (
                <button
                  key={st.email}
                  type="button"
                  disabled={!!loggingInEmail}
                  onClick={() => handle1ClickLogin(st.email, "Password123!")}
                  className="neu-card-sm p-3 rounded-xl text-left transition-all hover:border-indigo-400 hover:shadow-md group cursor-pointer flex items-center justify-between gap-2 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {st.name}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                        Sec {st.sec} • Roll {st.roll}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{st.adm} • {st.email}</p>
                  </div>
                  <span className="neu-btn px-2.5 py-1 text-[11px] font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {isLoggingIn ? "Signing In..." : "Login →"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TEACHER PANEL: Shows all 4 Faculty Teachers */}
      {selectedRole === "teacher" && (
        <div className="space-y-3.5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Choose Faculty Account</h3>
            <p className="text-xs text-slate-400 font-medium">
              Click any teacher below to open their subject workspace and gradebook.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {teachers.map((tc) => {
              const isLoggingIn = loggingInEmail === tc.email;
              return (
                <button
                  key={tc.email}
                  type="button"
                  disabled={!!loggingInEmail}
                  onClick={() => handle1ClickLogin(tc.email, "Password123!")}
                  className="neu-card-sm p-3.5 rounded-xl text-left transition-all hover:border-indigo-400 hover:shadow-md group cursor-pointer flex items-center justify-between gap-3 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {tc.name}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {tc.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-600 font-bold mt-1 truncate">{tc.subject}</p>
                    <p className="text-[10px] text-slate-400 truncate">{tc.classes} • {tc.email}</p>
                  </div>
                  <span className="neu-btn px-3 py-1.5 text-xs font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {isLoggingIn ? "Signing In..." : "Login →"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PARENT PANEL: Shows 4 Parent Accounts */}
      {selectedRole === "parent" && (
        <div className="space-y-3.5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Choose Parent Account</h3>
            <p className="text-xs text-slate-400 font-medium">
              Click any parent below to review their child's attendance, marks, and remarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {parents.map((pr) => {
              const isLoggingIn = loggingInEmail === pr.email;
              return (
                <button
                  key={pr.email}
                  type="button"
                  disabled={!!loggingInEmail}
                  onClick={() => handle1ClickLogin(pr.email, "Password123!")}
                  className="neu-card-sm p-3.5 rounded-xl text-left transition-all hover:border-indigo-400 hover:shadow-md group cursor-pointer flex items-center justify-between gap-3 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors block truncate">
                      {pr.name}
                    </span>
                    <p className="text-[11px] text-amber-700 font-bold mt-0.5 truncate">
                      Child: {pr.studentName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{pr.className} • {pr.email}</p>
                  </div>
                  <span className="neu-btn px-3 py-1.5 text-xs font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {isLoggingIn ? "Signing In..." : "Login →"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PRINCIPAL PANEL */}
      {selectedRole === "principal" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">School Principal Portal</h3>
            <p className="text-xs text-slate-400 font-medium">
              Executive institutional overview, school-wide metrics, and AI executive briefings.
            </p>
          </div>

          <div className="neu-card-sm p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Dr. Ramesh Iyer</span>
                <span className="neu-pill text-[9px] font-black px-2 py-0.5 text-purple-700 bg-purple-50">
                  Principal &amp; Head of Institution
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Email: <span className="font-mono text-slate-700">principal@learnmate.test</span>
              </p>
            </div>

            <button
              type="button"
              disabled={!!loggingInEmail}
              onClick={() => handle1ClickLogin("principal@learnmate.test", "Password123!")}
              className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <span>{loggingInEmail === "principal@learnmate.test" ? "Authenticating..." : "Sign In as Principal"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 5. ADMIN PANEL */}
      {selectedRole === "admin" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">System Administrator</h3>
            <p className="text-xs text-slate-400 font-medium">
              School-wide user provisioning, role permissions, timetable, and curriculum management.
            </p>
          </div>

          <div className="neu-card-sm p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">System Administrator</span>
                <span className="neu-pill text-[9px] font-black px-2 py-0.5 text-rose-700 bg-rose-50">
                  Full System Control
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Email: <span className="font-mono text-slate-700">admin@learnmate.test</span>
              </p>
            </div>

            <button
              type="button"
              disabled={!!loggingInEmail}
              onClick={() => handle1ClickLogin("admin@learnmate.test", "AdminPass123!")}
              className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <span>{loggingInEmail === "admin@learnmate.test" ? "Authenticating..." : "Sign In to Admin Panel"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Manual Email & Password Collapsible Toggle */}
      <div className="pt-2 border-t border-slate-200/60">
        <button
          type="button"
          onClick={() => setShowCustomLogin(!showCustomLogin)}
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer mx-auto transition-colors"
        >
          <Lock size={12} />
          <span>{showCustomLogin ? "Hide manual email & password login" : "Or sign in with custom email & password"}</span>
        </button>

        {showCustomLogin && (
          <form onSubmit={handleManualSubmit} className="mt-4 space-y-3.5 max-w-md mx-auto">
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
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
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

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-2xl">
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
