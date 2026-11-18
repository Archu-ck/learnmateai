"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { SkeletonSubjectCard } from "@/components/Skeleton";
import {
  BookOpen,
  User,
  Clock,
  FileText,
  CheckSquare,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

interface SubjectSummary {
  id: string;
  name: string;
  code: string;
  isElective: boolean;
  teacherName: string;
  pendingAssignments: number;
  nextTest: { title: string; date: string } | null;
  lastTopic: string;
  progress: number;
}

export default function StudentSubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "compulsory" | "elective">("ALL");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ subjects: SubjectSummary[] }>("/api/student/subjects");
        setSubjects(res.subjects || []);
      } catch (err: any) {
        toast(err.message || "Failed to load enrolled subjects", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const filtered = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "ALL" ||
      (filterType === "compulsory" && !s.isElective) ||
      (filterType === "elective" && s.isElective);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* Page Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            My Enrolled Subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Access your subject workspaces, syllabus topics, lessons, assignments, tests, and teacher support.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..."
              className="neu-input !pl-9 pr-3 py-2 text-xs font-medium w-44 sm:w-56"
            />
          </div>

          <div className="neu-inset p-1 rounded-xl flex gap-1 text-xs">
            {(["ALL", "compulsory", "elective"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterType === t
                    ? "neu-btn-primary text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t === "ALL" ? "All" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonSubjectCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center neu-card text-slate-500 space-y-2">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-extrabold text-slate-700">No Subjects Found</h3>
          <p className="text-xs text-slate-400 font-medium">
            {searchQuery ? "No subjects matched your search filter." : "You are not enrolled in any subjects yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filtered.map((sub) => (
            <Link
              key={sub.id}
              href={`/student/subjects/${sub.id}`}
              className="group block neu-card neu-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-white/80">
                  <div>
                    <span className="neu-pill px-2.5 py-0.5 text-[10px] font-mono font-black text-indigo-700 bg-indigo-50/80">
                      {sub.code}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors mt-2">
                      {sub.name}
                    </h2>
                  </div>

                  <span
                    className={`neu-pill text-[10px] font-black px-2.5 py-0.5 ${
                      sub.isElective
                        ? "bg-amber-100/80 text-amber-800"
                        : "bg-emerald-100/80 text-emerald-800"
                    }`}
                  >
                    {sub.isElective ? "Elective" : "Compulsory"}
                  </span>
                </div>

                {/* Teacher Name */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3.5 font-medium">
                  <User size={13} className="text-indigo-500" />
                  <span>Teacher: <strong className="text-slate-800 font-bold">{sub.teacherName}</strong></span>
                </div>

                {/* Last Topic */}
                <div className="neu-inset rounded-xl p-3 mb-4 text-xs">
                  <span className="text-[10px] uppercase tracking-wider font-black text-slate-400 block mb-0.5">
                    Current Topic
                  </span>
                  <span className="font-bold text-slate-800 block truncate">{sub.lastTopic}</span>
                </div>

                {/* Indicators: Assignments & Tests */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="neu-card-sm p-2.5 flex items-center gap-1.5 text-slate-600">
                    <FileText size={13} className="text-indigo-500 shrink-0" />
                    <span className="truncate">
                      {sub.pendingAssignments > 0 ? (
                        <strong className="text-amber-700 font-bold">{sub.pendingAssignments} pending</strong>
                      ) : (
                        <span className="text-slate-500 font-medium">All submitted</span>
                      )}
                    </span>
                  </div>

                  <div className="neu-card-sm p-2.5 flex items-center gap-1.5 text-slate-600">
                    <CheckSquare size={13} className="text-indigo-500 shrink-0" />
                    <span className="truncate">
                      {sub.nextTest ? (
                        <span className="text-indigo-700 font-bold">Test scheduled</span>
                      ) : (
                        <span className="text-slate-400 font-medium">No test</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Footer */}
              <div className="pt-3.5 border-t border-white/80">
                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                  <span className="text-slate-500 font-medium">Overall Mastery</span>
                  <span className="text-indigo-600 font-black">{sub.progress}%</span>
                </div>
                <div className="w-full h-2 neu-inset rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${sub.progress}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>Enter Subject Workspace</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
