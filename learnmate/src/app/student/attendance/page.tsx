"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AttendanceRecord {
  date: string;
  period: number;
  status: "present" | "absent" | "late" | "leave";
  remarks: string;
}

export default function StudentAttendancePage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Current view month (November 2026 default)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-based: 10 = November

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ attendanceRecords: AttendanceRecord[] }>(
          "/api/student/attendance"
        );
        setRecords(res.attendanceRecords || []);
      } catch (err: any) {
        toast(err.message || "Failed to load attendance records", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Compute stats
  const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const totalDays = records.length || 1;
  const attendanceRate = Math.round((presentCount / totalDays) * 100);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar dates generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const recordMap = new Map(records.map((r) => [r.date, r]));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Monthly Attendance Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Review daily attendance history, presence logs, and monthly compliance metrics.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="neu-card neu-card-hover p-4 sm:p-5 md:p-6 space-y-1">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Attendance Rate
          </span>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              {attendanceRate}%
            </span>
            <span className="neu-pill px-2 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50/80">On Track</span>
          </div>
        </div>

        <div className="neu-card neu-card-hover p-4 sm:p-5 md:p-6 space-y-1">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Present Days
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">{presentCount}</span>
        </div>

        <div className="neu-card neu-card-hover p-4 sm:p-5 md:p-6 space-y-1">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Late Arrivals
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 block">{lateCount}</span>
        </div>

        <div className="neu-card neu-card-hover p-4 sm:p-5 md:p-6 space-y-1">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Absences
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 block">{absentCount}</span>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="neu-card p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-6">
        {/* Month Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-white/80">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
              <CalendarIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <span>{monthNames[currentMonth]} {currentYear}</span>
          </h2>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="neu-circle w-8 h-8 sm:w-9 sm:h-9 text-slate-600 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="neu-circle w-8 h-8 sm:w-9 sm:h-9 text-slate-600 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[50px] sm:min-h-[72px] md:min-h-[80px] rounded-xl sm:rounded-2xl neu-inset opacity-25"
            />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const monthStr = (currentMonth + 1).toString().padStart(2, "0");
            const dayStr = dayNum.toString().padStart(2, "0");
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

            const rec = recordMap.get(dateStr);
            const status = rec?.status;

            return (
              <div
                key={dayNum}
                className={`min-h-[50px] sm:min-h-[72px] md:min-h-[80px] p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between ${
                  status === "present"
                    ? "neu-card-sm border-emerald-200/60 bg-emerald-50/30"
                    : status === "absent"
                    ? "neu-card-sm border-rose-200/60 bg-rose-50/30"
                    : status === "late"
                    ? "neu-card-sm border-amber-200/60 bg-amber-50/30"
                    : "neu-inset"
                }`}
              >
                <span className="text-[11px] sm:text-xs font-bold text-slate-800">{dayNum}</span>

                {status ? (
                  <div className="flex items-center">
                    {/* Compact Status Dot on Small/Mobile Screens */}
                    <span
                      className={`sm:hidden w-2 h-2 rounded-full self-center mx-auto my-0.5 ${
                        status === "present"
                          ? "bg-emerald-500"
                          : status === "absent"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      }`}
                      title={`${dateStr}: ${status}`}
                    />
                    {/* Full Status Pill Badge on Tablet / Desktop */}
                    <span
                      className={`hidden sm:inline-block neu-pill text-[10px] font-bold px-2 py-0.5 capitalize self-start truncate max-w-full ${
                        status === "present"
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "absent"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-slate-300 self-center mx-auto my-0.5" title="Holiday" />
                    <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium truncate">Holiday</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/80 text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Legend:</span>
          <div className="neu-pill flex items-center gap-1.5 px-3 py-1 text-emerald-800 bg-emerald-50/80 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="neu-pill flex items-center gap-1.5 px-3 py-1 text-amber-800 bg-amber-50/80 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Late</span>
          </div>
          <div className="neu-pill flex items-center gap-1.5 px-3 py-1 text-rose-800 bg-rose-50/80 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
