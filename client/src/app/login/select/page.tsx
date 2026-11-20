"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getRolePath } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import {
  GraduationCap,
  BookOpen,
  Users,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";

interface StudentProfile {
  name: string;
  email: string;
  adm: string;
  roll: string;
  sec: "A" | "B";
}

interface TeacherProfile {
  name: string;
  email: string;
  subject: string;
  classes: string;
  tag: string;
}

interface ParentProfile {
  name: string;
  email: string;
  studentName: string;
  studentClass: string;
  studentRoll: string;
  studentAdm: string;
}

const sampleStudents: StudentProfile[] = [
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

const sampleTeachers: TeacherProfile[] = [
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

const sampleParents: ParentProfile[] = [
  {
    name: "Rajesh Sharma",
    email: "parent@learnmate.test",
    studentName: "Aarav Sharma",
    studentClass: "Class 10-A",
    studentRoll: "Roll 1",
    studentAdm: "ADM-10A-001",
  },
  {
    name: "Sunil Gupta",
    email: "sunil.gupta@learnmate.test",
    studentName: "Rohan Gupta",
    studentClass: "Class 10-A",
    studentRoll: "Roll 3",
    studentAdm: "ADM-10A-003",
  },
  {
    name: "Rekha Verma",
    email: "rekha.verma@learnmate.test",
    studentName: "Devansh Verma",
    studentClass: "Class 10-B",
    studentRoll: "Roll 1",
    studentAdm: "ADM-10B-011",
  },
  {
    name: "Deepak Rao",
    email: "deepak.rao@learnmate.test",
    studentName: "Tanvi Rao",
    studentClass: "Class 10-B",
    studentRoll: "Roll 2",
    studentAdm: "ADM-10B-012",
  },
];

function PersonaSelectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const roleParam = searchParams.get("role") || "student";
  const [activeTab, setActiveTab] = useState<"student" | "teacher" | "parent">(
    roleParam === "teacher" ? "teacher" : roleParam === "parent" ? "parent" : "student"
  );

  useEffect(() => {
    if (roleParam === "teacher" || roleParam === "parent" || roleParam === "student") {
      setActiveTab(roleParam);
    }
  }, [roleParam]);

  const [sectionFilter, setSectionFilter] = useState<"ALL" | "A" | "B">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loggingInEmail, setLoggingInEmail] = useState<string | null>(null);

  const handleDirectLogin = async (email: string) => {
    setLoggingInEmail(email);
    try {
      const user = await login(email, "Password123!");
      if (user.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(getRolePath(user.role));
      }
    } catch (err: any) {
      toast(err.message || "Failed to sign in. Please verify connection.", "error");
      setLoggingInEmail(null);
    }
  };

  const filteredStudents = sampleStudents.filter((s) => {
    const matchesSection = sectionFilter === "ALL" || s.sec === sectionFilter;
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.adm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.includes(searchQuery);
    return matchesSection && matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Portal Login</span>
        </Link>

        {/* Tab Switcher Pills */}
        <div className="neu-inset p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab("student")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "student"
                ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap size={15} />
            <span>Students (20)</span>
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "teacher"
                ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={15} />
            <span>Teachers (4)</span>
          </button>
          <button
            onClick={() => setActiveTab("parent")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "parent"
                ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users size={15} />
            <span>Parents (4)</span>
          </button>
        </div>
      </div>

      {/* 1. STUDENT TILES VIEW */}
      {activeTab === "student" && (
        <div className="space-y-5">
          {/* Header & Filter Bar */}
          <div className="neu-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Select Student Account</span>
                <span className="neu-pill text-[10px] font-black px-2.5 py-0.5 text-indigo-700 bg-indigo-50">
                  Class 10
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Click any student tile below to immediately log in and access their dashboard, doubt solver, and courses.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, roll, or admission ID..."
                  className="neu-input w-full !pl-9 pr-3 py-2 text-xs font-medium rounded-xl"
                />
              </div>

              {/* Section Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl shrink-0">
                {(["ALL", "A", "B"] as const).map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectionFilter(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      sectionFilter === sec
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {sec === "ALL" ? "All (20)" : `Sec ${sec} (10)`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Grid Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStudents.map((s) => {
              const isLoggingIn = loggingInEmail === s.email;
              const initials = s.name
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <button
                  key={s.email}
                  type="button"
                  disabled={!!loggingInEmail}
                  onClick={() => handleDirectLogin(s.email)}
                  className="neu-card p-5 rounded-2xl text-left flex flex-col justify-between hover:scale-[1.03] hover:shadow-xl hover:border-indigo-400 border-2 border-transparent transition-all cursor-pointer group disabled:opacity-50 min-h-[170px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className="neu-inset px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-indigo-700 shrink-0">
                        Class 10-{s.sec}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        Roll {s.roll} • {s.adm}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    <span>{isLoggingIn ? "Logging In..." : "Click to Sign In"}</span>
                    <ArrowRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TEACHER TILES VIEW */}
      {activeTab === "teacher" && (
        <div className="space-y-5">
          <div className="neu-card p-6">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Select Teacher Account</span>
              <span className="neu-pill text-[10px] font-black px-2.5 py-0.5 text-emerald-800 bg-emerald-50">
                4 Faculty Members
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Click any faculty tile below to enter their subject dashboard, attendance, and assignment manager.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleTeachers.map((t) => {
              const isLoggingIn = loggingInEmail === t.email;
              const initials = t.name
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <button
                  key={t.email}
                  type="button"
                  disabled={!!loggingInEmail}
                  onClick={() => handleDirectLogin(t.email)}
                  className="neu-card p-6 rounded-2xl text-left flex flex-col justify-between hover:scale-[1.03] hover:shadow-xl hover:border-emerald-400 border-2 border-transparent transition-all cursor-pointer group disabled:opacity-50 min-h-[260px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {t.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs text-indigo-600 font-bold mt-1">
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        {t.classes}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {t.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                    <span>{isLoggingIn ? "Logging In..." : "Click to Sign In"}</span>
                    <ArrowRight size={15} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PARENT TILES VIEW */}
      {activeTab === "parent" && (
        <div className="space-y-5">
          <div className="neu-card p-6">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Select Parent Account</span>
              <span className="neu-pill text-[10px] font-black px-2.5 py-0.5 text-amber-800 bg-amber-50">
                4 Parent Profiles
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Click any parent tile below to review their child's academic attendance, test results, and report card.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleParents.map((pr) => {
              const isLoggingIn = loggingInEmail === pr.email;
              const initials = pr.name
                .split(" ")
                .map((n) => n[0])
                .join("");

              return (
                <button
                  key={pr.email}
                  type="button"
                  disabled={!!loggingInEmail}
                  onClick={() => handleDirectLogin(pr.email)}
                  className="neu-card p-6 rounded-2xl text-left flex flex-col justify-between hover:scale-[1.03] hover:shadow-xl hover:border-amber-400 border-2 border-transparent transition-all cursor-pointer group disabled:opacity-50 min-h-[260px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                        Parent Account
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-amber-700 transition-colors">
                        {pr.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {pr.email}
                      </p>
                    </div>

                    {/* Bottom Student Name Box explicitly displayed as requested */}
                    <div className="neu-inset p-3 rounded-xl border border-amber-100 bg-amber-50/40">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800/80 mb-0.5">
                        Associated Student
                      </div>
                      <div className="text-xs font-black text-slate-800">
                        {pr.studentName}
                      </div>
                      <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
                        {pr.studentClass} • {pr.studentRoll}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                    <span>{isLoggingIn ? "Logging In..." : "Click to Sign In"}</span>
                    <ArrowRight size={15} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonaSelectorPage() {
  return (
    <div className="min-h-screen bg-[#f0f3f8] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto neu-card p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading accounts...
          </div>
        }
      >
        <PersonaSelectorContent />
      </Suspense>
    </div>
  );
}
