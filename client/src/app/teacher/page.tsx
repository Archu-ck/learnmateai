"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";
import { useToast } from "@/components/Toast";
import {
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  MessageSquare,
  HelpCircle,
  Plus,
  Bot,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface TeacherDashboardData {
  teacher: {
    name: string;
    email: string;
  };
  tiles: {
    totalStudents: number;
    activeAssignmentsCount: number;
    averageGrade: number;
    completionRate: number;
  };
  needsGrading: Array<{
    assignmentId: string;
    title: string;
    className: string;
    section: string;
    subjectName: string;
    pendingCount: number;
  }>;
  unansweredDoubts: {
    count: number;
    latest: {
      studentName: string;
      subjectName: string;
      preview: string;
      timestamp: string;
    } | null;
  };
  studentsNeedingAttention: Array<{
    id: string;
    name: string;
    className: string;
    section: string;
    status: "Needs Attention" | "At Risk";
    averageGrade: number;
    reason: string;
  }>;
}

export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<TeacherDashboardData | null>(() =>
    api.getCached<TeacherDashboardData>("/api/teacher/dashboard")
  );
  const [loading, setLoading] = useState<boolean>(
    () => !api.getCached("/api/teacher/dashboard")
  );

  const loadDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get<TeacherDashboardData>("/api/teacher/dashboard");
      setData(res);
    } catch (err: any) {
      if (!silent) toast(err.message || "Failed to load teacher dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCached = !!api.getCached("/api/teacher/dashboard");
    loadDashboard(hasCached);
  }, []);

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        {/* Hero Greeting Card (Neumorphic) */}
        <div className="neu-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {todayDateString}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mt-1">
              Welcome back, {data?.teacher?.name || "Faculty Member"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Overview: You have {data?.needsGrading?.length || 0} student submissions awaiting evaluation and {data?.unansweredDoubts?.count || 0} student queries to answer.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/teacher/classes"
              className="neu-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <BookOpen size={15} />
              <span>My Classes</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Tiles Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="neu-card neu-card-hover p-5 space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Total Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">
                {data?.tiles?.totalStudents || 12}
              </span>
              <span className="text-[11px] font-bold text-slate-400">Enrolled</span>
            </div>
          </div>

          <div className="neu-card neu-card-hover p-5 space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Active Assignments
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">
                {data?.tiles?.activeAssignmentsCount || 0}
              </span>
              <span className="text-[11px] font-bold text-indigo-600">Published</span>
            </div>
          </div>

          <div className="neu-card neu-card-hover p-5 space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Average Grade
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">
                {data?.tiles?.averageGrade || 79}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600">Overall</span>
            </div>
          </div>

          <div className="neu-card neu-card-hover p-5 space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Completion Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">
                {data?.tiles?.completionRate || 88}%
              </span>
              <span className="text-[11px] font-bold text-indigo-600">Target 85%</span>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 neu-card animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CARD 1: Needs Grading Queue (2x1) */}
            <Link
              href="/teacher/classes"
              className="group md:col-span-2 neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <FileText size={15} />
                    </div>
                    <span>Needs Grading Queue</span>
                  </h2>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    All Submissions &rarr;
                  </span>
                </div>

                <div className="space-y-3">
                  {data?.needsGrading?.map((item, idx) => (
                    <div
                      key={idx}
                      className="neu-card-sm p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="neu-pill font-mono font-bold text-[10px] text-indigo-700 bg-indigo-50/80 px-2 py-0.5">
                            {item.className}-{item.section}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {item.subjectName}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 truncate mt-1">
                          {item.title}
                        </h3>
                      </div>
                      <span className="neu-pill px-3 py-1 font-black text-xs text-amber-700 bg-amber-50/80 shrink-0">
                        {item.pendingCount} Pending
                      </span>
                    </div>
                  ))}
                  {(!data?.needsGrading || data.needsGrading.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      All submitted assignments have been evaluated!
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* CARD 2: Unanswered Doubts (1x1) */}
            <Link
              href="/teacher/chat"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-xs">
                      <HelpCircle size={15} />
                    </div>
                    <span>Unresolved Doubts</span>
                  </h2>
                  {data?.unansweredDoubts?.count ? (
                    <span className="neu-pill px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black shadow-xs">
                      {data.unansweredDoubts.count} Active
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2 text-xs">
                  {data?.unansweredDoubts?.latest ? (
                    <div className="neu-inset p-3.5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>{data.unansweredDoubts.latest.studentName}</span>
                        <span>{data.unansweredDoubts.latest.subjectName}</span>
                      </div>
                      <p className="text-slate-700 font-medium line-clamp-2">
                        "{data.unansweredDoubts.latest.preview}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic py-4 text-center font-medium">
                      Zero pending student doubts!
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open chat inbox &rarr;
              </span>
            </Link>

            {/* CARD 3: Attendance to mark today (1x1) */}
            <Link
              href="/teacher/classes"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-xs">
                      <Calendar size={15} />
                    </div>
                    <span>Today's Attendance</span>
                  </h2>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-500 font-medium">
                    Daily class register status for {todayDateString}:
                  </p>
                  <div className="neu-card-sm p-3.5 space-y-1">
                    <span className="font-extrabold text-slate-800 block">
                      Grade 8 - Section A
                    </span>
                    <span className="text-emerald-700 font-bold text-[11px] block">
                      Ready to Record
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open class attendance &rarr;
              </span>
            </Link>

            {/* CARD 4: Students Needing Attention (2x1) */}
            <Link
              href="/teacher/classes"
              className="group md:col-span-2 neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-xs">
                      <AlertTriangle size={15} />
                    </div>
                    <span>Students Needing Attention</span>
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {data?.studentsNeedingAttention?.map((st) => (
                    <div
                      key={st.id}
                      className="neu-card-sm p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Sec {st.section}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] block mt-0.5 font-medium">
                          {st.reason}
                        </span>
                      </div>
                      <span
                        className={`neu-pill px-2.5 py-0.5 font-bold text-[10px] ${
                          st.status === "At Risk"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {st.status} ({st.averageGrade}%)
                      </span>
                    </div>
                  ))}
                  {(!data?.studentsNeedingAttention || data.studentsNeedingAttention.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      All students are performing on track!
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* CARD 5: Quick Actions (1x1) */}
            <div className="neu-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800">Quick Actions</h2>
                </div>

                <div className="space-y-2.5">
                  <Link
                    href="/teacher/classes"
                    className="neu-btn w-full flex items-center gap-2.5 p-3 text-slate-800 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Create Assignment</span>
                  </Link>

                  <Link
                    href="/teacher/classes"
                    className="neu-btn w-full flex items-center gap-2.5 p-3 text-slate-800 text-xs font-bold"
                  >
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    <span>Create Test</span>
                  </Link>

                  <Link
                    href="/teacher/chat"
                    className="neu-btn w-full flex items-center gap-2.5 p-3 text-slate-800 text-xs font-bold"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Resolve Doubts</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 6: AI Assistant Shortcuts (1x1) */}
            <div className="neu-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Bot size={15} />
                    </div>
                    <span>AI Faculty Assistant</span>
                  </h2>
                  <span className="neu-pill text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700">
                    Skeleton
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  Generate evaluations, draft assignments, and suggest feedback with realistic mock data.
                </p>

                <div className="space-y-2">
                  <Link
                    href="/teacher/classes"
                    className="neu-btn w-full flex items-center justify-between p-2.5 text-indigo-900 text-xs font-bold"
                  >
                    <span>Generate Test</span>
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                  </Link>
                  <Link
                    href="/teacher/classes"
                    className="neu-btn w-full flex items-center justify-between p-2.5 text-indigo-900 text-xs font-bold"
                  >
                    <span>Draft Assignment</span>
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CARD 7: Admin-Lite Summary Banner */}
        <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-extrabold">
              School System Diagnostics
            </span>
            <h2 className="text-base font-extrabold text-slate-800">Admin-Lite Overview</h2>
            <p className="text-xs text-slate-500 font-medium">
              Grade 8: 12 Students • 3 Faculty Members • 6 Subjects Configured • 0 Unassigned Subjects
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="neu-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
              <CheckCircle className="w-3.5 h-3.5" /> All Subjects Staffed
            </span>
            <span className="neu-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ebf0f6] text-slate-600 font-bold border border-white/80">
              School ID: school-default-01
            </span>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
