"use client";

import { useState } from "react";
import { Calendar, Clock, Sparkles, ChevronLeft, ChevronRight, BookOpen, Coffee, GraduationCap } from "lucide-react";
import AITutorPanel from "@/components/AITutorPanel";

type BlockType = "school" | "coaching" | "study" | "free";

interface ScheduleBlock {
  label: string;
  type: BlockType;
}

const blockStyles: Record<BlockType, { bg: string; text: string; border: string }> = {
  school: {
    bg: "bg-blue-500/10 hover:bg-blue-500/15",
    text: "text-blue-700",
    border: "border-blue-200/60",
  },
  coaching: {
    bg: "bg-violet-500/10 hover:bg-violet-500/15",
    text: "text-violet-700",
    border: "border-violet-200/60",
  },
  study: {
    bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
  },
  free: {
    bg: "bg-slate-500/5 hover:bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-200/40",
  },
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM",
];

const schedule: ScheduleBlock[][] = [
  // 8:00 AM
  [
    { label: "Mathematics", type: "school" },
    { label: "Physics", type: "school" },
    { label: "Chemistry", type: "school" },
    { label: "Mathematics", type: "school" },
    { label: "English", type: "school" },
    { label: "JEE Mathematics", type: "coaching" },
  ],
  // 9:00 AM
  [
    { label: "Physics", type: "school" },
    { label: "Chemistry", type: "school" },
    { label: "English", type: "school" },
    { label: "Physics", type: "school" },
    { label: "Mathematics", type: "school" },
    { label: "JEE Mathematics", type: "coaching" },
  ],
  // 10:00 AM
  [
    { label: "English", type: "school" },
    { label: "Mathematics", type: "school" },
    { label: "Physics", type: "school" },
    { label: "Computer Science", type: "school" },
    { label: "Chemistry", type: "school" },
    { label: "JEE Physics", type: "coaching" },
  ],
  // 11:00 AM
  [
    { label: "History", type: "school" },
    { label: "English", type: "school" },
    { label: "Computer Science", type: "school" },
    { label: "Chemistry", type: "school" },
    { label: "Physics", type: "school" },
    { label: "JEE Physics", type: "coaching" },
  ],
  // 12:00 PM
  [
    { label: "Lunch & Break", type: "free" },
    { label: "Lunch & Break", type: "free" },
    { label: "Lunch & Break", type: "free" },
    { label: "Lunch & Break", type: "free" },
    { label: "Lunch & Break", type: "free" },
    { label: "Lunch & Break", type: "free" },
  ],
  // 1:00 PM
  [
    { label: "Chemistry", type: "school" },
    { label: "Geography", type: "school" },
    { label: "Mathematics", type: "school" },
    { label: "English", type: "school" },
    { label: "History", type: "school" },
    { label: "Self Study: Chemistry", type: "study" },
  ],
  // 2:00 PM
  [
    { label: "Computer Science", type: "school" },
    { label: "History", type: "school" },
    { label: "Geography", type: "school" },
    { label: "History", type: "school" },
    { label: "Geography", type: "school" },
    { label: "Self Study: Physics", type: "study" },
  ],
  // 3:00 PM
  [
    { label: "Free / Sports", type: "free" },
    { label: "Free / Sports", type: "free" },
    { label: "Free / Sports", type: "free" },
    { label: "Free / Sports", type: "free" },
    { label: "Free / Sports", type: "free" },
    { label: "Free Time", type: "free" },
  ],
  // 4:00 PM
  [
    { label: "JEE Mathematics", type: "coaching" },
    { label: "Self Study: Math", type: "study" },
    { label: "JEE Physics", type: "coaching" },
    { label: "Self Study: English", type: "study" },
    { label: "JEE Chemistry", type: "coaching" },
    { label: "Free Time", type: "free" },
  ],
  // 5:00 PM
  [
    { label: "JEE Mathematics", type: "coaching" },
    { label: "Self Study: Physics", type: "study" },
    { label: "JEE Physics", type: "coaching" },
    { label: "Self Study: Chemistry", type: "study" },
    { label: "JEE Chemistry", type: "coaching" },
    { label: "Free Time", type: "free" },
  ],
  // 6:00 PM
  [
    { label: "Self Study: Chem", type: "study" },
    { label: "JEE Chemistry", type: "coaching" },
    { label: "Self Study: Math", type: "study" },
    { label: "JEE Mathematics", type: "coaching" },
    { label: "Self Study: Physics", type: "study" },
    { label: "Free Time", type: "free" },
  ],
  // 7:00 PM
  [
    { label: "Self Study: Physics", type: "study" },
    { label: "JEE Chemistry", type: "coaching" },
    { label: "Self Study: History", type: "study" },
    { label: "JEE Mathematics", type: "coaching" },
    { label: "Self Study: Math", type: "study" },
    { label: "Free Time", type: "free" },
  ],
  // 8:00 PM
  [
    { label: "Dinner & Rest", type: "free" },
    { label: "Dinner & Rest", type: "free" },
    { label: "Dinner & Rest", type: "free" },
    { label: "Dinner & Rest", type: "free" },
    { label: "Dinner & Rest", type: "free" },
    { label: "Dinner & Rest", type: "free" },
  ],
];

export default function PlannerPage() {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | "all">("all");

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filter Info */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="neu-pill px-3 py-1 text-xs font-bold text-indigo-700 bg-white">
              Weekly Timetable
            </span>
            <span className="text-xs text-slate-400 font-medium">Nov 16 — Nov 22, 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-1.5">
            Balanced Study Planner
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Synchronized with school periods, JEE coaching, and homework blocks.
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            School (24h)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            Coaching (12h)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Self-Study (14h)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            Breaks
          </span>
        </div>
      </div>

      {/* Timetable Table Card */}
      <div className="neu-card p-4 sm:p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left py-3 px-3 w-24">
                  Time Slot
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="text-xs font-extrabold text-slate-700 text-center py-3 px-2"
                  >
                    <span className="neu-pill px-3.5 py-1 text-xs bg-white text-slate-800 inline-block shadow-2xs">
                      {day}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {timeSlots.map((time, rowIdx) => (
                <tr key={time} className="hover:bg-white/40 transition-colors">
                  <td className="text-xs font-bold text-slate-500 py-2.5 px-3 whitespace-nowrap">
                    {time}
                  </td>
                  {days.map((_, colIdx) => {
                    const block = schedule[rowIdx]?.[colIdx];
                    if (!block) return <td key={colIdx} />;
                    const style = blockStyles[block.type];

                    return (
                      <td key={colIdx} className="p-1">
                        <div
                          className={`text-xs p-2 rounded-xl text-center font-semibold border transition-all duration-150 shadow-2xs ${style.bg} ${style.text} ${style.border}`}
                        >
                          {block.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AITutorPanel />
    </div>
  );
}
