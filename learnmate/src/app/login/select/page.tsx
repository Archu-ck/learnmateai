"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getRolePath } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import {
  GraduationCap,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
  UserCheck,
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
  note?: string;
}

interface TeacherProfile {
  name: string;
  email: string;
  subject: string;
  classes: string;
  isClassTeacher?: string;
}

const sampleStudents: StudentProfile[] = [
  // Section A
  { name: "Aarav Sharma", email: "student@learnmate.test", adm: "ADM-10A-001", roll: "1", sec: "A", note: "Primary demo student" },
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
  { name: "Devansh Verma", email: "devansh.v@learnmate.test", adm: "ADM-10B-011", roll: "1", sec: "B", note: "Counselor watch (71% attendance)" },
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
    isClassTeacher: "Class Teacher • 10-A",
  },
  {
    name: "Dr. Vikram Sharma",
    email: "vikram.sharma@learnmate.test",
    subject: "Science & Chemistry (SCI10)",
    classes: "Class 10-A, Class 10-B",
    isClassTeacher: "Class Teacher • 10-B",
  },
  {
    name: "Sunita Menon",
    email: "sunita.menon@learnmate.test",
    subject: "English Language & Literature (ENG10)",
    classes: "Class 10-A, Class 10-B",
    isClassTeacher: "English Dept Lead",
  },
  {
    name: "Rajiv Tandon",
    email: "rajiv.tandon@learnmate.test",
    subject: "Social Science (SST10)",
    classes: "Class 10-A, Class 10-B",
    isClassTeacher: "Social Science Lead",
  },
];

function PersonaSelectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const roleParam = searchParams.get("role") || "student";
  const [activeTab, setActiveTab] = useState<"student" | "teacher">(
    roleParam === "teacher" ? "teacher" : "student"
  );
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
      toast(err.message || "Failed to sign in with this demo persona", "error");
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Standard Login</span>
        </Link>

        <span className="text-xs font-bold text-slate-500 bg-white/60 px-3 py-1 rounded-full border border-slate-200">
          Account Selector
        </span>
      </div>

      {/* Header Banner */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200/60 inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles size={11} className="text-indigo-500" />
              <span>Persona Switcher</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Session 2026-2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Demonstration Account Selector
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Select any registered student or teaching faculty member to sign in with 1-click.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="neu-inset p-1 rounded-2xl flex gap-1 self-start md:self-auto">
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
        </div>
      </div>

      {/* Student List View */}
      {activeTab === "student" && (
        <div className="space-y-5">
          {/* Search & Section Filter Bar */}
          <div className="neu-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, or admission no..."
                className="neu-input w-full !pl-9 pr-3 py-2 text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              {(["ALL", "A", "B"] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSectionFilter(sec)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    sectionFilter === sec
                      ? "neu-inset text-indigo-700 font-extrabold"
                      : "neu-btn text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {sec === "ALL" ? "All Sections" : `Section ${sec}`}
                </button>
              ))}
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => {
              const isLoggingIn = loggingInEmail === s.email;
              return (
                <div
                  key={s.email}
                  className="neu-card p-5 space-y-3.5 flex flex-col justify-between hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          {s.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-800 leading-snug">
                            {s.name}
                          </h3>
                          <div className="text-[11px] text-slate-400 font-medium truncate">
                            {s.email}
                          </div>
                        </div>
                      </div>

                      <span className="neu-inset px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-indigo-700 shrink-0">
                        Class 10-{s.sec}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                      <span>Roll No. {s.roll}</span>
                      <span className="text-slate-400 font-mono">{s.adm}</span>
                    </div>

                    {s.note && (
                      <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                        {s.note}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDirectLogin(s.email)}
                    disabled={!!loggingInEmail}
                    className="neu-btn w-full py-2.5 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoggingIn ? "Signing In..." : `Login as ${s.name.split(" ")[0]}`}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Teacher List View */}
      {activeTab === "teacher" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sampleTeachers.map((t) => {
            const isLoggingIn = loggingInEmail === t.email;
            return (
              <div
                key={t.email}
                className="neu-card p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-emerald-500/20">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800">{t.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">{t.email}</p>
                      </div>
                    </div>

                    {t.isClassTeacher && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {t.isClassTeacher}
                      </span>
                    )}
                  </div>

                  <div className="neu-inset p-3.5 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Department</span>
                      <span className="font-bold text-slate-800">{t.subject}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Assigned Classes</span>
                      <span className="font-bold text-slate-800">{t.classes}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDirectLogin(t.email)}
                  disabled={!!loggingInEmail}
                  className="neu-btn-primary w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/25 disabled:opacity-50"
                >
                  <span>{isLoggingIn ? "Signing In..." : `Login as ${t.name}`}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
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
            Loading persona selector...
          </div>
        }
      >
        <PersonaSelectorContent />
      </Suspense>
    </div>
  );
}
