"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  PlusCircle,
} from "lucide-react";

interface TeacherClassItem {
  id: string;
  classId: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  isClassTeacher?: boolean;
  studentCount: number;
  averageGrade: number;
  completionRate: number;
}

export default function TeacherClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ classes: TeacherClassItem[] }>("/api/teacher/classes");
        setClasses(res.classes || []);
      } catch (err: any) {
        toast(err.message || "Failed to load assigned classes", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            My Teaching Classes & Sections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your assigned class workspaces, student rosters, assessments, gradebooks, and attendance.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 neu-card animate-pulse"
            />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center neu-card text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Classes Assigned</h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            You do not currently have any class-section-subject assignments. Please contact the administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/teacher/classes/${cls.id}`}
              className="group block neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header: Class & Badges */}
                <div className="flex items-start justify-between gap-2 mb-2 pb-3 border-b border-white/80">
                  <div>
                    <span className="neu-pill text-[10px] font-mono font-extrabold px-2.5 py-0.5 bg-white/70 text-slate-600">
                      {cls.subjectCode}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors mt-2">
                      {cls.className} - Section {cls.section}
                    </h2>
                  </div>

                  {cls.isClassTeacher && (
                    <span className="neu-pill text-[10px] font-extrabold px-2.5 py-0.5 bg-indigo-50/80 text-indigo-700 border border-indigo-200/60">
                      Class Teacher
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-700 mb-5">
                  {cls.subjectName}
                </div>

                {/* 3 Metrics: Students, Average Grade, Completion Rate */}
                <div className="grid grid-cols-3 gap-2 py-3.5 px-4 neu-inset rounded-2xl mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5 tracking-wider">
                      Students
                    </span>
                    <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                      <Users size={14} className="text-indigo-500" />
                      {cls.studentCount}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5 tracking-wider">
                      Avg Grade
                    </span>
                    <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      {cls.averageGrade}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5 tracking-wider">
                      Completion
                    </span>
                    <span className="text-sm font-black text-indigo-600 flex items-center gap-1">
                      <CheckCircle size={14} className="text-indigo-500" />
                      {cls.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3.5 border-t border-white/80 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>Open Class Workspace</span>
                <ChevronRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
