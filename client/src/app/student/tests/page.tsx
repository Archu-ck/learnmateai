"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  CheckSquare,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface TestItem {
  id: string;
  title: string;
  subjectName: string;
  durationMinutes: number;
  totalMarks: number;
  startWindow: string;
  endWindow: string;
  status: "upcoming" | "available" | "in_progress" | "completed" | "expired";
  attempt: {
    id: string;
    score: number;
    totalMarks: number;
    submittedAt: string;
  } | null;
}

export default function StudentTestsPage() {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestItem[]>(() => {
    const cached = api.getCached<{ tests: TestItem[] }>("/api/student/tests");
    return cached?.tests || [];
  });
  const [loading, setLoading] = useState<boolean>(() => !api.getCached("/api/student/tests"));
  const [tabFilter, setTabFilter] = useState<"all" | "available" | "completed">("all");

  useEffect(() => {
    const hasCached = !!api.getCached("/api/student/tests");
    const fetchTests = async () => {
      try {
        if (!hasCached) setLoading(true);
        const res = await api.get<{ tests: TestItem[] }>("/api/student/tests");
        setTests(res.tests || []);
      } catch (err: any) {
        if (!hasCached) toast(err.message || "Failed to load tests", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    if (tabFilter === "available") {
      return t.status === "available" || t.status === "in_progress";
    }
    if (tabFilter === "completed") {
      return t.status === "completed";
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Tests & Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Timed subject quizzes, unit tests, and performance reviews.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="neu-inset p-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTabFilter("all")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              tabFilter === "all"
                ? "neu-btn text-slate-900 font-extrabold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Tests ({tests.length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter("available")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              tabFilter === "available"
                ? "neu-btn-primary text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Available Now
          </button>
          <button
            type="button"
            onClick={() => setTabFilter("completed")}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              tabFilter === "completed"
                ? "neu-pill bg-emerald-600 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed
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
      ) : filteredTests.length === 0 ? (
        <div className="p-12 text-center neu-card text-slate-400">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Tests Found</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            There are currently no scheduled tests in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((t) => (
            <div
              key={t.id}
              className="neu-card neu-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="neu-pill text-[10px] font-extrabold px-2.5 py-0.5 bg-white/70 text-slate-700 uppercase">
                    {t.subjectName}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800 break-words">{t.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-500" />
                    {t.durationMinutes} mins
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award size={13} className="text-indigo-500" />
                    {t.totalMarks} Total Marks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-500" />
                    Window: {new Date(t.startWindow).toLocaleDateString()} -{" "}
                    {new Date(t.endWindow).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status & CTA */}
              <div className="flex items-center gap-3">
                {t.status === "completed" ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="neu-pill text-xs font-bold px-2.5 py-0.5 bg-emerald-100/80 text-emerald-800 block">
                        Score: {t.attempt?.score} / {t.totalMarks}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        Completed
                      </span>
                    </div>
                    <Link
                      href={`/student/tests/${t.id}/results`}
                      className="neu-btn px-4 py-2 text-slate-800 text-xs font-bold"
                    >
                      View Results
                    </Link>
                  </div>
                ) : t.status === "available" || t.status === "in_progress" ? (
                  <Link
                    href={`/student/tests/${t.id}/take`}
                    className="neu-btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl"
                  >
                    <span>{t.status === "in_progress" ? "Resume Test" : "Start Test"}</span>
                    <ChevronRight size={14} />
                  </Link>
                ) : (
                  <span className="neu-pill text-xs font-bold px-3 py-1 bg-[#ebf0f6] text-slate-500">
                    Upcoming (Opens {new Date(t.startWindow).toLocaleDateString()})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
