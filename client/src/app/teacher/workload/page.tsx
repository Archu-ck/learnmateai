"use client";

import { AlertTriangle, Clock, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Assignment {
  name: string;
  hours: number;
  subject: string;
}

interface DayData {
  day: string;
  date: string;
  assignments: Assignment[];
}

const weekData: DayData[] = [
  {
    day: "Mon",
    date: "Nov 16",
    assignments: [
      { name: "Quadratic Equations", hours: 1.0, subject: "Mathematics" },
      { name: "Lab Report", hours: 1.0, subject: "Physics" },
    ],
  },
  {
    day: "Tue",
    date: "Nov 17",
    assignments: [{ name: "English Essay", hours: 1.5, subject: "English" }],
  },
  {
    day: "Wed",
    date: "Nov 18",
    assignments: [
      { name: "Mathematics Worksheet", hours: 1.5, subject: "Mathematics" },
      { name: "Physics Problems", hours: 1.5, subject: "Physics" },
      { name: "History Essay", hours: 1.0, subject: "History" },
    ],
  },
  {
    day: "Thu",
    date: "Nov 19",
    assignments: [{ name: "Computer Science Assignment", hours: 1.0, subject: "CS" }],
  },
  {
    day: "Fri",
    date: "Nov 20",
    assignments: [
      { name: "Chemistry Lab Report", hours: 1.0, subject: "Chemistry" },
      { name: "Hindi Translation", hours: 1.0, subject: "Hindi" },
    ],
  },
  {
    day: "Sat",
    date: "Nov 21",
    assignments: [{ name: "Mathematics Practice", hours: 1.0, subject: "Mathematics" }],
  },
  {
    day: "Sun",
    date: "Nov 22",
    assignments: [],
  },
];

export default function WorkloadPage() {
  const totalHours = weekData.reduce(
    (sum, d) => sum + d.assignments.reduce((s, a) => s + a.hours, 0),
    0
  );
  const overloadedDays = weekData.filter(
    (d) => d.assignments.reduce((s, a) => s + a.hours, 0) > 3
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/teacher"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400 font-medium">Nov 16 — Nov 22, 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Homework &amp; Student Workload Balance
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor cognitive load across all subjects to prevent student fatigue.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="flex items-center gap-3">
          <div className="neu-inset px-4 py-2 bg-white/70 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Weekly Hours</p>
            <p className="text-base font-extrabold text-slate-800">{totalHours} hrs</p>
          </div>
          <div className="neu-inset px-4 py-2 bg-white/70 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Avg / Day</p>
            <p className="text-base font-extrabold text-slate-800">{(totalHours / 7).toFixed(1)} hrs</p>
          </div>
        </div>
      </div>

      {/* Warning banner if overloaded */}
      {overloadedDays > 0 && (
        <div className="neu-card p-4 sm:p-5 bg-gradient-to-r from-amber-50/90 to-orange-50/80 border border-amber-200/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Workload Notice: Wednesday, Nov 18 exceeds homework threshold
            </h3>
            <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
              Students have 4.0 hours of combined homework across Math, Physics, and History. Recommended daily maximum is 3.0 hours. Consider spreading due dates to Thursday or Friday.
            </p>
          </div>
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekData.map((day) => {
          const dayTotal = day.assignments.reduce((s, a) => s + a.hours, 0);
          const isOverloaded = dayTotal > 3;

          return (
            <div
              key={day.day}
              className={`neu-card p-4 flex flex-col justify-between transition-all ${
                isOverloaded
                  ? "border-rose-300/80 ring-2 ring-rose-400/20 bg-gradient-to-b from-rose-50/40 to-white"
                  : "bg-white/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-sm text-slate-800">{day.day}</span>
                  <span className="text-[11px] font-medium text-slate-400">{day.date}</span>
                </div>

                <div className="my-3 text-center">
                  <span
                    className={`text-2xl font-black ${
                      isOverloaded ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {dayTotal}h
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Load</p>
                </div>

                <div className="space-y-1.5 mt-2">
                  {day.assignments.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-slate-50 text-[11px] text-slate-400 font-medium">
                      No assignments
                    </div>
                  ) : (
                    day.assignments.map((a) => (
                      <div
                        key={a.name}
                        className="p-2 rounded-xl bg-[#ebf0f6] text-[11px] border border-white/80"
                      >
                        <p className="font-bold text-slate-700 truncate">{a.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium flex justify-between mt-0.5">
                          <span>{a.subject}</span>
                          <span className="font-bold text-indigo-600">{a.hours}h</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {isOverloaded && (
                <div className="mt-3 text-[10px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg text-center">
                  ⚠️ Overload (+1.0h)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
