"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";
import { useToast } from "@/components/Toast";
import {
  FileText,
  BookOpen,
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  MessageSquare,
  Bell,
  Bot,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface StudentDashboardData {
  student: {
    name: string;
    rollNumber: string;
    section: string;
    className: string;
  };
  dueSoon: Array<{
    id: string;
    title: string;
    subjectName: string;
    dueDate: string;
    status: string;
  }>;
  subjectProgress: Array<{
    id: string;
    name: string;
    percentage: number;
  }>;
  upcomingTests: Array<{
    id: string;
    title: string;
    subjectName: string;
    date: string;
  }>;
  studyPlanToday: Array<{
    _id?: string;
    title: string;
    subjectName: string;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
  }>;
  attendancePercentage: number;
  weakTopics: Array<{
    topicName: string;
    subjectName: string;
    scorePercentage: number;
  }>;
  recentGrades: Array<{
    id: string;
    title: string;
    subjectName: string;
    marksAwarded: number;
    totalMarks: number;
    percentage: number;
    trend: "up" | "down" | "same";
  }>;
  unreadMessagesCount: number;
  latestMessageSnippet: string;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
  weeklyWorkload: Array<{
    day: string;
    hours: number;
  }>;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiDoubtInput, setAiDoubtInput] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<StudentDashboardData>("/api/student/dashboard");
      setData(res);
    } catch (err: any) {
      toast(err.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleAskAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDoubtInput.trim()) return;
    router.push(
      `/student/subjects?askAI=true&question=${encodeURIComponent(aiDoubtInput)}`
    );
  };

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="space-y-6 w-full pb-16 font-sans">
        {/* Top Greeting Card (Neumorphic) */}
        <div className="neu-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {todayDateString}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mt-1">
              Good day, {data?.student?.name || "Student"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              What's next: You have {data?.dueSoon?.length || 2} assignments pending this week and your next evaluation is in 3 days.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/subjects"
              className="neu-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <BookOpen size={15} />
              <span>My Subjects</span>
            </Link>
          </div>
        </div>

        {/* Bento Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-44 neu-card animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CARD 1: Due soon (2x1) */}
            <Link
              href="/student/assignments"
              className="group md:col-span-2 neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <FileText size={15} />
                    </div>
                    <span>Due Soon — Assignments</span>
                  </h2>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    All Assignments <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="space-y-3">
                  {data?.dueSoon?.map((item) => (
                    <div
                      key={item.id}
                      className="neu-card-sm p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                          {item.subjectName}
                        </span>
                        <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-slate-600 block">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black text-amber-700 bg-amber-50/80 inline-block mt-0.5">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!data?.dueSoon || data.dueSoon.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      No upcoming assignments due.
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* CARD 2: Subject Progress (2x1) */}
            <Link
              href="/student/subjects"
              className="group md:col-span-2 neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <BookOpen size={15} />
                    </div>
                    <span>Subject Syllabus Mastery</span>
                  </h2>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View subjects &rarr;
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data?.subjectProgress?.slice(0, 4).map((sub, idx) => (
                    <div key={idx} className="space-y-1.5 neu-card-sm p-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 truncate">{sub.name}</span>
                        <span className="text-indigo-600 font-black">{sub.percentage}%</span>
                      </div>
                      <div className="w-full h-2 neu-inset rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500 shadow-xs"
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* CARD 3: Upcoming Tests (1x1) */}
            <Link
              href="/student/tests"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <CheckSquare size={15} />
                    </div>
                    <span>Upcoming Tests</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {data?.upcomingTests?.map((t) => (
                    <div
                      key={t.id}
                      className="neu-card-sm p-3.5 space-y-1 text-xs"
                    >
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {t.subjectName}
                      </span>
                      <h3 className="font-extrabold text-slate-800 truncate mt-0.5">{t.title}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-bold pt-1">
                        <Clock size={13} />
                        <span>Date: {new Date(t.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {(!data?.upcomingTests || data.upcomingTests.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      No upcoming tests scheduled.
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View tests portal &rarr;
              </span>
            </Link>

            {/* CARD 4: Study Plan for Today (1x1) */}
            <Link
              href="/student/planner"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Calendar size={15} />
                    </div>
                    <span>Today's Study Plan</span>
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {data?.studyPlanToday?.slice(0, 3).map((b, idx) => (
                    <div
                      key={b._id || idx}
                      className="neu-card-sm p-3 flex items-center gap-2.5 text-xs"
                    >
                      <div className="neu-inset w-5 h-5 rounded-md flex items-center justify-center">
                        {b.isCompleted && <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />}
                      </div>
                      <span className="font-bold text-slate-700 truncate">
                        {b.title || b.subjectName}
                      </span>
                    </div>
                  ))}
                  {(!data?.studyPlanToday || data.studyPlanToday.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      No study blocks added for today.
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open study planner &rarr;
              </span>
            </Link>

            {/* CARD 5: Attendance (1x1) */}
            <Link
              href="/student/attendance"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-xs">
                      <CheckCircle2 size={15} />
                    </div>
                    <span>School Attendance</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">
                      {data?.attendancePercentage || 94}%
                    </span>
                    <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50/80">
                      Present
                    </span>
                  </div>

                  {/* Mini month strip in recessed well */}
                  <div className="neu-inset p-2.5 rounded-xl">
                    <div className="grid grid-cols-7 gap-1.5">
                      {[1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1].map((val, i) => (
                        <span
                          key={i}
                          className={`h-2.5 rounded-full ${
                            val ? "bg-emerald-500 shadow-xs" : "bg-rose-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View monthly calendar &rarr;
              </span>
            </Link>

            {/* CARD 6: Recent Grades (1x1) */}
            <Link
              href="/student/progress"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Award size={15} />
                    </div>
                    <span>Recent Grades</span>
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {data?.recentGrades?.slice(0, 3).map((g) => (
                    <div
                      key={g.id}
                      className="neu-card-sm p-3 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-800 truncate block">
                          {g.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{g.subjectName}</span>
                      </div>
                      <span className="font-black text-indigo-600">{g.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View all grades &rarr;
              </span>
            </Link>

            {/* CARD 7: Weak Topics (2x1) */}
            <Link
              href="/student/progress"
              className="group md:col-span-2 neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-xs">
                      <AlertTriangle size={15} />
                    </div>
                    <span>Weak Topics — Focus Areas</span>
                  </h2>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Full Mastery Heatmap &rarr;
                  </span>
                </div>

                <div className="space-y-2.5">
                  {data?.weakTopics?.map((wt, idx) => (
                    <div
                      key={idx}
                      className="neu-card-sm p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                          {wt.subjectName}
                        </span>
                        <h3 className="font-extrabold text-slate-800 truncate mt-0.5">
                          {wt.topicName}
                        </h3>
                      </div>
                      <span className="neu-pill px-3 py-1 text-xs font-black text-amber-700 bg-amber-50/80">
                        {wt.scorePercentage}%
                      </span>
                    </div>
                  ))}
                  {(!data?.weakTopics || data.weakTopics.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      All topics meeting proficiency targets!
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* CARD 8: Messages & Doubts (1x1) */}
            <Link
              href="/student/subjects"
              className="group neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <MessageSquare size={15} />
                    </div>
                    <span>Teacher Messages</span>
                  </h2>
                  {data?.unreadMessagesCount ? (
                    <span className="neu-pill px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black shadow-sm">
                      {data.unreadMessagesCount} New
                    </span>
                  ) : null}
                </div>

                <div className="neu-inset p-3.5 text-xs text-slate-600">
                  <span className="text-[10px] font-black text-slate-400 block mb-0.5 uppercase tracking-wider">
                    Latest snippet:
                  </span>
                  <p className="line-clamp-2 font-medium">
                    {data?.latestMessageSnippet || "No recent messages from teachers."}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 pt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open teacher chat &rarr;
              </span>
            </Link>

            {/* CARD 9: Workload this week (1x1) */}
            <div className="neu-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <TrendingUp size={15} />
                    </div>
                    <span>Homework Hours</span>
                  </h2>
                </div>

                <div className="flex items-end justify-between gap-2.5 h-24 pt-2">
                  {data?.weeklyWorkload?.map((wl, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full neu-inset rounded-t-lg h-20 flex items-end p-0.5">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-md transition-all shadow-xs"
                          style={{ height: `${Math.min(100, (wl.hours / 3) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {wl.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 10: Announcements (2x1) */}
            <div className="md:col-span-2 neu-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Bell size={15} />
                    </div>
                    <span>School Announcements</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {data?.announcements?.map((a) => (
                    <div
                      key={a.id}
                      className="neu-card-sm p-3.5 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-800">{a.title}</h3>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-1 font-medium">{a.content}</p>
                    </div>
                  ))}
                  {(!data?.announcements || data.announcements.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-4 text-center font-medium">
                      No new announcements.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 11: Ask AI Doubt (2x1) */}
            <div className="md:col-span-2 neu-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Bot size={15} />
                    </div>
                    <span>Ask AI Doubt Assistant</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  Ask any question regarding your syllabus topics for immediate step-by-step guidance.
                </p>

                <form onSubmit={handleAskAISubmit} className="space-y-2.5">
                  <input
                    type="text"
                    value={aiDoubtInput}
                    onChange={(e) => setAiDoubtInput(e.target.value)}
                    placeholder="Type your syllabus doubt or problem..."
                    className="neu-input w-full"
                  />
                  <button
                    type="submit"
                    className="neu-btn-primary w-full py-2.5 text-xs font-bold rounded-xl"
                  >
                    Consult AI Tutor
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
