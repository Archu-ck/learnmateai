"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  GraduationCap,
  Calendar,
  CheckSquare,
  Clock,
  TrendingUp,
  FileText,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  BookOpen,
  Award,
  Bell,
  RefreshCw,
  User,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface ChildItem {
  id: string;
  name: string;
  email: string;
  admissionNo: string;
  className: string;
  section: string;
  rollNumber: string;
}

interface ParentDashboardData {
  parent: {
    id: string;
    name: string;
    email: string;
  };
  children: ChildItem[];
  selectedChild: {
    id: string;
    name: string;
    email: string;
    admissionNo: string;
    className: string;
    section: string;
  } | null;
  stats: {
    attendancePercentage: number;
    academicAverage: number;
    pendingAssignmentsCount: number;
    upcomingTestsCount: number;
    totalSubjectsCount: number;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    teacherName: string;
    teacherEmail: string;
    averagePercentage: number;
    status: string;
  }>;
  recentGrades: Array<{
    id: string;
    title: string;
    subjectName: string;
    type: string;
    marksAwarded: number;
    totalMarks: number;
    percentage: number;
    feedback: string;
    date: string;
  }>;
  pendingAssignments: Array<{
    id: string;
    title: string;
    subjectName: string;
    subjectCode: string;
    dueDate: string;
    totalMarks: number;
    estimatedMinutes: number;
    status: string;
  }>;
  upcomingTests: Array<{
    id: string;
    title: string;
    subjectName: string;
    startWindow: string;
    endWindow: string;
    durationMinutes: number;
    totalMarks: number;
  }>;
  recentAttendance: Array<{
    id: string;
    date: string;
    status: string;
    remarks: string;
  }>;
  classTeacher: {
    name: string;
    email: string;
    subjectName: string;
    role: string;
  } | null;
  announcements: Array<{
    _id: string;
    title: string;
    content: string;
    priority?: string;
    createdAt: string;
  }>;
  aiInsight: {
    overallStatus: string;
    highlightText: string;
    strengths: string[];
    focusAreas: string[];
    encouragementNote: string;
  } | null;
}

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [data, setData] = useState<ParentDashboardData | null>(() =>
    api.getCached<ParentDashboardData>("/api/parent/dashboard")
  );
  const [loading, setLoading] = useState<boolean>(() => !api.getCached("/api/parent/dashboard"));
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "grades" | "attendance" | "teacher">("overview");

  // AI Guardian Report state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [customAIReport, setCustomAIReport] = useState<any>(null);

  const loadData = async (childId?: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const url = childId ? `/api/parent/dashboard?childId=${childId}` : "/api/parent/dashboard";
      const res = await api.get<ParentDashboardData>(url);
      setData(res);
      if (res.selectedChild && !selectedChildId) {
        setSelectedChildId(res.selectedChild.id);
      }
    } catch (err: any) {
      if (!silent) toast(err.message || "Failed to load parent dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCached = !!api.getCached("/api/parent/dashboard");
    loadData(selectedChildId || undefined, hasCached);
  }, [selectedChildId]);

  const handleChildChange = (id: string) => {
    setSelectedChildId(id);
    loadData(id, false);
  };

  const handleGenerateAIReport = async () => {
    if (!data?.selectedChild?.id) return;
    try {
      setGeneratingAI(true);
      const res = await api.post<{ report: any }>("/api/parent/ai-summary", {
        childId: data.selectedChild.id,
      });
      setCustomAIReport(res.report);
      toast("AI Guardian Progress Briefing generated successfully!", "success");
    } catch (err: any) {
      toast(err.message || "Could not generate AI report at this time", "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  const parentName = user?.name || data?.parent?.name || "Parent";
  const activeChild = data?.selectedChild || data?.children?.[0];

  return (
    <RoleGuard allowedRoles={["parent"]}>
      <div className="space-y-7 max-w-7xl mx-auto pb-16 font-sans">
        {/* Welcome Hero Banner */}
        <div className="neu-card p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/25 shrink-0">
              {parentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200/60 inline-flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={12} className="text-emerald-500" />
                  <span>Guardian Portal</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Session 2026-2027</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Welcome, {parentName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Vidya Bharati Public School • Parent Community &amp; Academic Overview
              </p>
            </div>
          </div>

          {/* Child Switcher Selector */}
          {data?.children && data.children.length > 0 && (
            <div className="neu-inset p-3 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-indigo-600">
                <GraduationCap size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ward In Focus
                </div>
                {data.children.length > 1 ? (
                  <select
                    value={activeChild?.id || ""}
                    onChange={(e) => handleChildChange(e.target.value)}
                    className="bg-transparent text-xs font-extrabold text-slate-800 cursor-pointer focus:outline-none"
                  >
                    {data.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.className}-{c.section})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-extrabold text-slate-800">
                    {activeChild?.name} • {activeChild?.className}-{activeChild?.section}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4 Core KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Overall Attendance */}
          <div className="neu-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attendance Rate
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {data?.stats?.attendancePercentage ?? 92.5}%
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {(data?.stats?.attendancePercentage ?? 92.5) >= 90 ? "Excellent" : "Regular"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Daily morning roll call attendance across secondary academic term.
            </p>
          </div>

          {/* 2. Academic Performance GPA */}
          <div className="neu-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Academic Average
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Award size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {data?.stats?.academicAverage ?? 84.5}%
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Distinction
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Cumulative mastery across homework sets, topic tests, and term assessments.
            </p>
          </div>

          {/* 3. Pending Homework */}
          <div className="neu-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pending Homework
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {data?.stats?.pendingAssignmentsCount ?? 0}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {(data?.stats?.pendingAssignmentsCount ?? 0) === 0 ? "All Clear" : "Due Soon"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Assignments currently assigned by subject faculty with pending submission.
            </p>
          </div>

          {/* 4. Upcoming Tests */}
          <div className="neu-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Upcoming Exams
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <CheckSquare size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {data?.upcomingTests?.length ?? 0}
              </span>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                On Schedule
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Formal syllabus evaluations and chapter tests scheduled this month.
            </p>
          </div>
        </div>

        {/* AI Guardian Pedagogical Insights Banner */}
        <div className="neu-card p-6 sm:p-7 relative overflow-hidden space-y-5 border border-indigo-100/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    AI Guardian Academic Insights
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {customAIReport?.institutionalHealthStatus || data?.aiInsight?.overallStatus || "Thriving Academically"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Continuous pedagogical progress assessment synthesized from class evaluations.
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateAIReport}
              disabled={generatingAI}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-2 cursor-pointer self-start md:self-auto disabled:opacity-50"
            >
              <RefreshCw size={13} className={generatingAI ? "animate-spin" : ""} />
              <span>{generatingAI ? "Analyzing Ward Data..." : "Refresh AI Report"}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-3">
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              {customAIReport?.overallSummary ||
                data?.aiInsight?.highlightText ||
                `${activeChild?.name} is showing excellent commitment and consistency across secondary core subjects.`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Strengths */}
              <div className="neu-inset p-3.5 rounded-xl space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Key Strengths</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                  {(customAIReport?.keyStrengths || data?.aiInsight?.strengths || [
                    "High conceptual clarity in Mathematics algebra and formulas",
                    "Punctual attendance and active classroom participation",
                  ]).map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Focus Areas */}
              <div className="neu-inset p-3.5 rounded-xl space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  <span>Home Study Recommendations</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                  {(customAIReport?.focusAreas || data?.aiInsight?.focusAreas || [
                    "Dedicate 20 minutes daily for science numerical revision",
                    "Maintain structured 45-minute homework blocks before 8:00 PM",
                  ]).map((f: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {data?.aiInsight?.encouragementNote && (
              <p className="text-[11px] text-slate-500 italic pt-1">
                💡 {data.aiInsight.encouragementNote}
              </p>
            )}
          </div>
        </div>

        {/* Interactive View Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          {[
            { id: "overview", label: "Subject Breakdown", icon: <BookOpen size={14} /> },
            { id: "grades", label: "Recent Grades & Feedback", icon: <Award size={14} /> },
            { id: "attendance", label: "Attendance Log", icon: <Calendar size={14} /> },
            { id: "teacher", label: "Class Teacher & Mentor", icon: <User size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                  : "neu-btn text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Subject Breakdown */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.subjects?.map((sub) => (
                <div key={sub.id} className="neu-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {sub.code}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800">{sub.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Faculty: {sub.teacherName}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.averagePercentage >= 80
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Term Mastery</span>
                      <span className="text-slate-800">{sub.averagePercentage}%</span>
                    </div>
                    <div className="neu-progress-track">
                      <div
                        className="neu-progress-fill bg-gradient-to-r from-indigo-500 to-violet-600"
                        style={{ width: `${sub.averagePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium">Teacher Support</span>
                    <Link
                      href={`/student/chat`}
                      className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <span>Direct Chat</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Homework & Upcoming Exams Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Homework */}
              <div className="neu-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    <span>Homework &amp; Assignments</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {data?.pendingAssignments?.length || 0} Listed
                  </span>
                </div>

                {data?.pendingAssignments && data.pendingAssignments.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.pendingAssignments.map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl bg-white/70 border border-slate-200/50 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{a.title}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {a.subjectName} • Due: {new Date(a.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            a.status === "Submitted"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="neu-inset p-6 text-center text-xs text-slate-500 font-medium rounded-xl">
                    No pending homework assignments due this week.
                  </div>
                )}
              </div>

              {/* Upcoming Exams */}
              <div className="neu-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <CheckSquare size={16} className="text-rose-600" />
                    <span>Examination Schedule</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {data?.upcomingTests?.length || 0} Scheduled
                  </span>
                </div>

                {data?.upcomingTests && data.upcomingTests.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.upcomingTests.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-white/70 border border-slate-200/50 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{t.title}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {t.subjectName} • Duration: {t.durationMinutes}m • Max: {t.totalMarks} Marks
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                          {new Date(t.startWindow).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="neu-inset p-6 text-center text-xs text-slate-500 font-medium rounded-xl">
                    No scheduled examinations in the immediate window.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Recent Grades & Feedback */}
        {activeTab === "grades" && (
          <div className="neu-card p-6 sm:p-7 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Recent Grades &amp; Teacher Feedback
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified marks awarded with educator commentary for continuous improvement.
              </p>
            </div>

            {data?.recentGrades && data.recentGrades.length > 0 ? (
              <div className="space-y-3">
                {data.recentGrades.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800">{g.title}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {g.subjectName}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {g.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium italic">
                        "{g.feedback}"
                      </p>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Evaluated: {new Date(g.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-slate-800">
                          {g.marksAwarded} / {g.totalMarks}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">Marks Scored</div>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
                          g.percentage >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {g.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="neu-inset p-8 text-center text-xs text-slate-500 font-medium rounded-xl">
                No recent assignment or assessment grades logged yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Attendance Log */}
        {activeTab === "attendance" && (
          <div className="neu-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Daily Attendance Records
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Verified morning assembly roll call and presence logging.
                </p>
              </div>
              <div className="neu-inset px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                Term Average: {data?.stats?.attendancePercentage ?? 92.5}%
              </div>
            </div>

            {data?.recentAttendance && data.recentAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {new Date(rec.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === "present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : rec.status === "late"
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                            }`}
                          >
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{rec.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="neu-inset p-8 text-center text-xs text-slate-500 font-medium rounded-xl">
                Attendance register is being initialized for this month.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Class Teacher & Mentor */}
        {activeTab === "teacher" && (
          <div className="neu-card p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <User size={32} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {data?.classTeacher?.name || "Meera Krishnan"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {data?.classTeacher?.role || "Class Teacher"} • {activeChild?.className}-{activeChild?.section}
              </p>
            </div>

            <div className="neu-inset p-5 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">Academic Department</span>
                <span className="font-bold text-slate-800">
                  {data?.classTeacher?.subjectName || "Mathematics & Physics"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                <span className="text-slate-500 font-medium">Institutional Email</span>
                <span className="font-bold text-slate-800">
                  {data?.classTeacher?.email || "teacher@learnmate.test"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Consultation Window</span>
                <span className="font-bold text-slate-800">Mon - Fri, 2:30 PM - 3:30 PM</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/student/chat"
                className="flex-1 neu-btn-primary py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
              >
                <MessageSquare size={14} />
                <span>Message Class Teacher</span>
              </Link>
              <a
                href={`mailto:${data?.classTeacher?.email || "teacher@learnmate.test"}`}
                className="neu-btn px-5 py-3 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:text-indigo-600"
              >
                <Mail size={14} />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        )}

        {/* Security & Password Quick Action */}
        <div className="neu-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <span>
              Guardian account authenticated for Vidya Bharati Public School. Keep your password confidential.
            </span>
          </div>
          <Link
            href="/change-password"
            className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 shrink-0 self-start sm:self-auto"
          >
            Change Password
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
