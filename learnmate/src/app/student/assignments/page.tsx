"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import NeumorphicSelect from "@/components/NeumorphicSelect";
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";

interface StudentAssignmentItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  dueDate: string;
  totalMarks: number;
  estimatedMinutes: number;
  aiHelpLevel: string;
  status: string;
  submission: {
    id: string;
    marksAwarded: number | null;
    feedback: string;
    status: string;
  } | null;
}

export default function StudentAssignmentsPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<StudentAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"dueDate" | "title">("dueDate");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ assignments: StudentAssignmentItem[] }>(
          "/api/student/assignments"
        );
        setAssignments(res.assignments || []);
      } catch (err: any) {
        toast(err.message || "Failed to load assignments", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // Distinct subjects for filter dropdown
  const uniqueSubjects = Array.from(
    new Set(assignments.map((a) => a.subjectName).filter(Boolean))
  );

  // Filter & Sort
  const filtered = assignments
    .filter((a) => {
      if (subjectFilter !== "ALL" && a.subjectName !== subjectFilter) return false;
      if (statusFilter !== "ALL") {
        if (statusFilter.toLowerCase() !== a.status.toLowerCase()) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            My Subject Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track coursework deadlines, submit homework, and view teacher feedback.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Filter */}
          <NeumorphicSelect
            value={subjectFilter}
            onChange={(val) => setSubjectFilter(val)}
            options={[
              { value: "ALL", label: "All Subjects", badge: "All" },
              ...uniqueSubjects.map((s) => ({ value: s, label: s })),
            ]}
            icon={<BookOpen className="w-3.5 h-3.5" />}
            minWidth="min-w-[170px]"
          />

          {/* Status Filter */}
          <NeumorphicSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "Pending", label: "Pending" },
              { value: "In progress", label: "In Progress" },
              { value: "Submitted", label: "Submitted" },
              { value: "Graded", label: "Graded" },
              { value: "Late", label: "Late" },
            ]}
            icon={<Filter className="w-3.5 h-3.5" />}
            minWidth="min-w-[160px]"
          />

          {/* Sort By */}
          <button
            type="button"
            onClick={() => setSortBy(sortBy === "dueDate" ? "title" : "dueDate")}
            className="neu-btn flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            Sort: {sortBy === "dueDate" ? "Due Date" : "Title"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 neu-card animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center neu-card text-slate-400">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Assignments Found</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            No assignments match your selected subject and status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ass) => {
            const isLate = ass.status === "Late";
            const isGraded = ass.status === "Graded";
            const isSubmitted = ass.status === "Submitted";

            return (
              <div
                key={ass.id}
                className="neu-card neu-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="neu-pill text-[10px] font-extrabold px-2.5 py-0.5 bg-white/70 text-slate-700 uppercase">
                      {ass.subjectName}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 break-words">{ass.title}</h3>
                    <span className="neu-pill text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700">
                      AI: {ass.aiHelpLevel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-500" />
                      Due: {new Date(ass.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-500" />
                      Est. {ass.estimatedMinutes} mins
                    </span>
                    <span>Total Marks: {ass.totalMarks}</span>
                  </div>
                </div>

                {/* Status & Open Button */}
                <div className="flex items-center gap-3">
                  <span
                    className={`neu-pill text-xs font-bold px-3 py-1 ${
                      isGraded
                        ? "bg-emerald-100/80 text-emerald-800"
                        : isSubmitted
                        ? "bg-blue-100/80 text-blue-800"
                        : isLate
                        ? "bg-rose-100/80 text-rose-800"
                        : "bg-amber-100/80 text-amber-800"
                    }`}
                  >
                    {isGraded
                      ? `Graded (${ass.submission?.marksAwarded}/${ass.totalMarks})`
                      : ass.status}
                  </span>

                  <Link
                    href={`/student/assignments/${ass.id}`}
                    className="neu-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
                  >
                    <span>{isGraded ? "View Feedback" : "Open & Submit"}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
