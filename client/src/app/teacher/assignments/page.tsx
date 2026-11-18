"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  BookOpen,
  Users,
  ChevronRight,
  TrendingUp,
  Filter,
} from "lucide-react";

interface TeacherClassOption {
  classId: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
}

interface AssignmentItem {
  _id: string;
  title: string;
  subjectId?: { name: string; code: string };
  classId?: { name: string };
  section: string;
  dueDate: string;
  totalMarks: number;
  estimatedMinutes: number;
  aiHelpLevel: string;
  status: string;
  submissionCount?: number;
}

interface DayWorkload {
  date: string;
  dayName: string;
  formattedDate: string;
  assignments: Array<{
    id: string;
    title: string;
    subjectName: string;
    subjectCode: string;
    estimatedMinutes: number;
  }>;
  totalMinutes: number;
  totalHours: number;
  isOverloaded: boolean;
}

export default function TeacherAssignmentsManagerPage() {
  const { toast } = useToast();

  const [classes, setClasses] = useState<TeacherClassOption[]>(() => {
    return api.getCached<{ classes: TeacherClassOption[] }>("/api/teacher/classes")?.classes || [];
  });
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);

  const initialClass = classes[0];
  const [assignments, setAssignments] = useState<AssignmentItem[]>(() => {
    if (!initialClass) return [];
    const url = `/api/teacher/assignments?classId=${initialClass.classId}&section=${initialClass.section}`;
    return api.getCached<{ assignments: AssignmentItem[] }>(url)?.assignments || [];
  });

  const [calendarDays, setCalendarDays] = useState<DayWorkload[]>(() => {
    if (!initialClass) return [];
    const url = `/api/teacher/workload/calendar?classId=${initialClass.classId}&section=${initialClass.section}`;
    return api.getCached<{ days: DayWorkload[] }>(url)?.days || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return classes.length === 0 && assignments.length === 0;
  });

  // Load classes
  useEffect(() => {
    const hasCachedClasses = classes.length > 0;
    async function loadClasses() {
      try {
        const res = await api.get<{ classes: TeacherClassOption[] }>("/api/teacher/classes");
        const list = res.classes || [];
        setClasses(list);
        if (list.length > 0 && selectedClassIndex === 0) {
          setSelectedClassIndex(0);
        }
      } catch (err: any) {
        if (!hasCachedClasses) toast(err.message || "Failed to load classes", "error");
      }
    }
    loadClasses();
  }, []);

  const activeClass = classes[selectedClassIndex];

  // Load assignments and workload calendar when class changes
  useEffect(() => {
    if (!activeClass) return;

    const assignUrl = `/api/teacher/assignments?classId=${activeClass.classId}&section=${activeClass.section}`;
    const calUrl = `/api/teacher/workload/calendar?classId=${activeClass.classId}&section=${activeClass.section}`;

    const cachedAssign = api.getCached<{ assignments: AssignmentItem[] }>(assignUrl);
    const cachedCal = api.getCached<{ days: DayWorkload[] }>(calUrl);

    if (cachedAssign?.assignments) setAssignments(cachedAssign.assignments);
    if (cachedCal?.days) setCalendarDays(cachedCal.days);

    const hasCached = !!(cachedAssign?.assignments && cachedCal?.days);

    async function loadData() {
      try {
        if (!hasCached) setLoading(true);
        const [assignRes, calendarRes] = await Promise.all([
          api.get<{ assignments: AssignmentItem[] }>(assignUrl),
          api.get<{ days: DayWorkload[] }>(calUrl),
        ]);

        setAssignments(assignRes.assignments || []);
        setCalendarDays(calendarRes.days || []);
      } catch (err: any) {
        if (!hasCached) toast(err.message || "Failed to load assignment manager data", "error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeClass]);

  const totalAssigned = assignments.length;
  const overloadedDaysCount = calendarDays.filter((d) => d.isOverloaded).length;
  const avgMinutes =
    assignments.length > 0
      ? Math.round(
          assignments.reduce((sum, a) => sum + (a.estimatedMinutes || 45), 0) / assignments.length
        )
      : 45;

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header Bar */}
      <div className="neu-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700 bg-amber-50 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-600" />
              <span>Smart Workload Optimizer</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800">
            Smart Assignment &amp; Workload Manager
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            AI-driven cognitive load monitoring, balanced homework scheduling, and assignment lifecycle tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/assignments/create"
            className="neu-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/25"
          >
            <Plus size={15} />
            <span>Create Assignment</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Active Assignments
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <FileText size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{totalAssigned}</div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            Published for {activeClass?.className || "Class 10"} - {activeClass?.section || "A"}
          </span>
        </div>

        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Overload Alerts
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                overloadedDaysCount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {overloadedDaysCount > 0 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{overloadedDaysCount} Days</div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            {overloadedDaysCount > 0
              ? "Exceeds 90m daily homework threshold"
              : "All days within healthy cognitive limit"}
          </span>
        </div>

        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Average Student Effort
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600">{avgMinutes} Mins</div>
          <span className="text-[11px] font-semibold text-slate-500 block">
            AI-estimated completion per assignment
          </span>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="neu-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter by Assigned Class:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {classes.map((c, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedClassIndex(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                idx === selectedClassIndex
                  ? "neu-btn-primary text-white"
                  : "neu-btn text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>
                {c.className} - {c.section} ({c.subjectName})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Cognitive Load Calendar */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/80">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" />
              <span>Weekly Cognitive Homework Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live schedule of all subject assignments for Class {activeClass?.className} - {activeClass?.section}.
            </p>
          </div>
          <span className="neu-pill text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1">
            Max Recommended: 90m / day
          </span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {calendarDays.map((day, idx) => {
            const isOverloaded = day.isOverloaded;
            const percentage = Math.min(100, Math.round((day.totalMinutes / 90) * 100));

            return (
              <div
                key={idx}
                className={`neu-card-sm p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                  isOverloaded ? "border-2 border-rose-400/80 bg-rose-50/50" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800">{day.dayName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {day.date.split("-").slice(1).join("/")}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span
                        className={`text-lg font-black ${
                          isOverloaded ? "text-rose-600" : day.totalMinutes > 50 ? "text-amber-600" : "text-slate-800"
                        }`}
                      >
                        {day.totalMinutes}m
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {day.totalHours} hrs
                      </span>
                    </div>

                    {/* Progress Meter */}
                    <div className="w-full h-1.5 neu-inset rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverloaded
                            ? "bg-rose-500"
                            : day.totalMinutes > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Day's Assignments List */}
                <div className="space-y-1.5 pt-2 border-t border-white/60">
                  {day.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="neu-pill px-2 py-1 text-[10px] font-bold text-slate-700 bg-white/70 truncate flex items-center justify-between gap-1"
                    >
                      <span className="truncate">{a.title}</span>
                      <span className="font-extrabold text-indigo-600 shrink-0">
                        {a.estimatedMinutes}m
                      </span>
                    </div>
                  ))}
                  {day.assignments.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic block text-center py-2">
                      No assignments
                    </span>
                  )}
                </div>

                {isOverloaded && (
                  <span className="neu-pill px-2 py-0.5 text-[9px] font-black uppercase text-rose-700 bg-rose-100 flex items-center justify-center gap-1">
                    <AlertTriangle size={10} />
                    <span>Overload Risk</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Assignments Table / Card View */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/80">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" />
            <span>Class Assignments Registry</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Showing {assignments.length} assignments
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium space-y-3">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p>No assignments scheduled for this class yet.</p>
            <Link
              href="/teacher/assignments/create"
              className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create First Assignment</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/60">
            {assignments.map((a) => (
              <div
                key={a._id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/30 rounded-xl px-2 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-extrabold text-slate-800">{a.title}</h3>
                    <span className="neu-pill px-2 py-0.2 text-[9px] font-bold text-indigo-700 bg-indigo-50">
                      {a.subjectId?.name || "Subject"}
                    </span>
                    <span className="neu-pill px-2 py-0.2 text-[9px] font-mono text-slate-600 bg-slate-100">
                      {a.totalMarks} Marks
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-indigo-500" />
                      <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-indigo-500" />
                      <span>Effort: <strong>{a.estimatedMinutes || 45} mins</strong></span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>AI Help: {a.aiHelpLevel || "Hints only"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-700 block">
                      {a.submissionCount || 0} Submissions
                    </span>
                    <span className="neu-pill px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50">
                      Active
                    </span>
                  </div>

                  <Link
                    href={`/teacher/classes`}
                    className="neu-btn px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 text-slate-700 hover:text-slate-900"
                  >
                    <span>View Class</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
