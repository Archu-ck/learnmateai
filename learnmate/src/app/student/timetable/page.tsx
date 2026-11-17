"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Clock,
  Calendar,
  BookOpen,
  User,
  MapPin,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface TimetableItem {
  id: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  room: string;
}

export default function StudentTimetablePage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ timetable: TimetableItem[] }>("/api/student/timetable");
        setEntries(res.timetable || []);
      } catch (err: any) {
        toast(err.message || "Failed to load timetable", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const dayEntries = entries
    .filter((e) => e.day === selectedDay)
    .sort((a, b) => a.period - b.period);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Weekly Class Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Your daily period schedule scoped to your enrolled subjects and assigned classrooms.
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="neu-inset p-1.5 rounded-2xl flex overflow-x-auto gap-1.5">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              selectedDay === d
                ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 neu-card animate-pulse"
            />
          ))}
        </div>
      ) : dayEntries.length === 0 ? (
        <div className="p-12 text-center neu-card text-slate-400">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Classes Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            No periods found for {selectedDay}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEntries.map((period) => (
            <div
              key={period.id}
              className="neu-card neu-card-hover p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {/* Period Badge */}
                <div className="w-12 h-12 rounded-2xl neu-inset text-indigo-700 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] uppercase font-black text-indigo-500">Prd</span>
                  <span className="text-base font-black">{period.period}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-800">
                      {period.subjectName}
                    </h3>
                    {period.subjectCode && (
                      <span className="neu-pill text-[10px] font-mono font-bold px-2 py-0.5 bg-white/70 text-slate-600">
                        {period.subjectCode}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-500" />
                      {period.startTime} - {period.endTime}
                    </span>
                    {period.teacherName && (
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-indigo-500" />
                        {period.teacherName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Room Badge */}
              <div className="neu-pill flex items-center gap-2 text-xs font-bold text-slate-700 bg-white/70 px-3.5 py-1.5 self-start sm:self-auto">
                <MapPin size={13} className="text-indigo-500" />
                <span>{period.room}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
