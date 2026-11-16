"use client";

import { ArrowUp, Bot, CheckCircle, ArrowLeft, Award, Sparkles, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";

const scores = [
  { label: "Sep Unit Test", score: 72, change: null },
  { label: "Oct Monthly", score: 78, change: "+6%" },
  { label: "Nov Mid-term", score: 85, change: "+7%" },
  { label: "Nov Unit Test", score: 88, change: "+3%" },
];

const topics = [
  { name: "Algebra & Linear Equations", percent: 88, color: "from-indigo-500 to-violet-500" },
  { name: "Coordinate Geometry", percent: 72, color: "from-sky-400 to-blue-500" },
  { name: "Trigonometric Identities", percent: 65, color: "from-amber-400 to-orange-400" },
  { name: "Statistics & Probability", percent: 91, color: "from-emerald-400 to-teal-500" },
  { name: "Intro to Calculus", percent: 58, color: "from-rose-400 to-coral-500" },
];

const statusReasons = [
  "Consistently improving score trajectory across the last 3 monthly assessments (+16% total gain).",
  "Demonstrates high conceptual clarity and rapid submission speed in Algebra and Statistics.",
  "Requires supplementary practice in Calculus concepts — recommended targeted practice problem set.",
  "Class attendance sits at 94%, well above the cohort average of 88%.",
];

const aiUsage = [
  { label: "Tutor Sessions This Month", value: "12 Sessions", icon: Clock },
  { label: "Avg Session Duration", value: "18 mins / session", icon: Bot },
  { label: "Key Problem Focus", value: "Quadratic Equations & Trigonometry", icon: BookOpen },
  { label: "Student Helpfulness Rating", value: "98% Positive Feedback", icon: Sparkles },
];

export default function StudentProfilePage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Student Banner */}
      <div className="neu-card p-6 sm:p-7 bg-gradient-to-r from-[#f0f3f8] via-[#f7f9fd] to-[#eff3f9]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-500/25 shrink-0">
              AS
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/teacher"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  <span>Teacher Roster</span>
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-400">Student ID #1042</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Aarav Sharma
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Class X-A • Roll No. 01 • Enrolled Academic Year 2026-27
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusChip status="On Track" size="md" />
          </div>
        </div>
      </div>

      {/* Marks Trend Cards */}
      <div className="neu-card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Assessment Performance Trend
            </h2>
            <p className="text-xs text-slate-400">Quarterly unit tests and midterm evaluations</p>
          </div>
          <span className="neu-pill px-3 py-1 text-xs font-bold text-emerald-600 bg-white">
            Steady Growth (+16%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {scores.map((s) => (
            <div key={s.label} className="neu-card-sm p-4 text-center bg-white/70">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {s.label}
              </span>
              <span className="text-3xl font-black text-slate-800 block">
                {s.score}%
              </span>
              {s.change ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 mt-1">
                  <ArrowUp size={12} />
                  <span>{s.change}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 mt-1 block">Baseline</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Topic Mastery & Status Reasons (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Mastery */}
        <div className="neu-card p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
            Subject Topic Mastery
          </h2>
          <p className="text-xs text-slate-400 mb-5">Evaluated across homework and practice drills</p>

          <div className="space-y-4">
            {topics.map((t) => (
              <div key={t.name}>
                <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1.5">
                  <span className="text-slate-700">{t.name}</span>
                  <span className="text-slate-800 font-bold">{t.percent}%</span>
                </div>
                <div className="neu-progress h-2.5 w-full">
                  <div
                    className={`neu-progress-bar h-2.5 bg-gradient-to-r ${t.color}`}
                    style={{ width: `${t.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Reasons */}
        <div className="neu-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <CheckCircle className="text-indigo-600" size={18} />
              <span>Academic Status Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mb-5">Clear explanatory insights for teachers &amp; parents</p>

            <ul className="space-y-3">
              {statusReasons.map((reason, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-white/80 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-2xs"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AI Tutor Usage Summary */}
      <div className="neu-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Bot size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              AI Study Assistant Engagement
            </h2>
            <p className="text-xs text-slate-400">Curriculum-aligned queries and topic clarification</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiUsage.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="neu-card-sm p-4 bg-white/70">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Icon size={14} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  {item.label}
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
