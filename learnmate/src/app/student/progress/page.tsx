"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import StudentPracticeQuizModal from "@/components/StudentPracticeQuizModal";
import {
  TrendingUp,
  Award,
  Layers,
  AlertTriangle,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  Bot,
} from "lucide-react";

interface ProgressData {
  subjectCards: Array<{
    subjectId: string;
    subjectName: string;
    averagePercentage: number;
    recentScores: number[];
  }>;
  masteryHeatmap: Array<{
    topicId: string;
    topicName: string;
    subjectId?: string;
    subjectName: string;
    level: string;
    scorePercentage: number;
  }>;
  weakTopics: Array<{
    topicId: string;
    topicName: string;
    subjectId?: string;
    subjectName: string;
    scorePercentage: number;
  }>;
  attendancePercentage: number;
  totalAssessments: number;
}

export default function StudentProgressPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState<{
    subjectId: string;
    subjectName: string;
    topicId?: string;
    topicName: string;
  } | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await api.get<ProgressData>("/api/student/progress");
        setData(res);
      } catch (err: any) {
        toast(err.message || "Failed to load progress analytics", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <div className="h-28 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const { subjectCards, masteryHeatmap, weakTopics, attendancePercentage, totalAssessments } =
    data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Academic Progress & Mastery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Detailed performance trends, topic comprehension heatmaps, and revision focus areas.
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="neu-card neu-card-hover p-6 space-y-1">
          <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Attendance Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">
              {attendancePercentage}%
            </span>
            <span className="neu-pill px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50/80">Present</span>
          </div>
        </div>

        <div className="neu-card neu-card-hover p-6 space-y-1">
          <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Evaluated Assessments
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">
              {totalAssessments}
            </span>
            <span className="neu-pill px-2.5 py-0.5 text-xs font-bold text-indigo-700 bg-indigo-50/80">Completed</span>
          </div>
        </div>

        <div className="neu-card neu-card-hover p-6 space-y-1">
          <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Areas Needing Revision
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">
              {weakTopics.length}
            </span>
            <span className="text-xs font-bold text-slate-500">Topics</span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Performance Cards */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-extrabold text-slate-800">
          Subject-Wise Average & Trend
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectCards.map((sub) => (
            <div
              key={sub.subjectId}
              className="neu-card-sm p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">{sub.subjectName}</h3>
                <span className="text-sm font-black text-indigo-600">
                  {sub.averagePercentage}%
                </span>
              </div>

              <div className="w-full h-2.5 neu-inset rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                    sub.averagePercentage >= 80
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : sub.averagePercentage >= 65
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                      : "bg-gradient-to-r from-amber-500 to-rose-500"
                  }`}
                  style={{ width: `${sub.averagePercentage}%` }}
                />
              </div>

              {sub.recentScores.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 font-medium">
                  <span>Recent scores:</span>
                  <div className="flex gap-1 font-bold">
                    {sub.recentScores.map((sc, idx) => (
                      <span
                        key={idx}
                        className="neu-pill px-2 py-0.5 text-slate-700 bg-white/70"
                      >
                        {sc}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Topic Mastery Heatmap */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Topic Mastery Heatmap
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Visual overview of concept mastery across all your enrolled subjects.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="neu-pill px-2.5 py-1 flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;80%
            </span>
            <span className="neu-pill px-2.5 py-1 flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50/80">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> 65-79%
            </span>
            <span className="neu-pill px-2.5 py-1 flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50/80">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> &lt;65%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {masteryHeatmap.map((m, idx) => {
            const isHigh = m.scorePercentage >= 80;
            const isMid = m.scorePercentage >= 65 && m.scorePercentage < 80;
            return (
              <div
                key={idx}
                className={`neu-card-sm p-3.5 transition-all ${
                  isHigh
                    ? "border-emerald-200/60 bg-emerald-50/30"
                    : isMid
                    ? "border-indigo-200/60 bg-indigo-50/30"
                    : "border-amber-200/60 bg-amber-50/30"
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block truncate tracking-wider">
                  {m.subjectName}
                </span>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {m.topicName}
                </h3>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/80">
                  <span className="text-[10px] font-bold capitalize text-slate-600">
                    {m.level}
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {m.scorePercentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Topics Focus List */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          Weak Topics - Recommended for Revision
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Topics where comprehension is below target. Click "Practise this" to launch targeted review.
        </p>

        <div className="space-y-3">
          {weakTopics.map((wt, idx) => (
            <div
              key={idx}
              className="neu-card-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  {wt.subjectName}
                </span>
                <h3 className="text-sm font-bold text-slate-800">{wt.topicName}</h3>
                <span className="text-xs text-amber-700 font-bold">
                  Current mastery: {wt.scorePercentage}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const subCard = subjectCards.find((s) => s.subjectName === wt.subjectName);
                  setSelectedPracticeTopic({
                    subjectId: wt.subjectId || subCard?.subjectId || "",
                    subjectName: wt.subjectName,
                    topicId: wt.topicId,
                    topicName: wt.topicName,
                  });
                  setPracticeModalOpen(true);
                }}
                className="neu-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap self-start sm:self-auto"
              >
                <Bot size={14} />
                <span>Practise this Topic</span>
              </button>
            </div>
          ))}
          {weakTopics.length === 0 && (
            <p className="neu-pill text-xs text-emerald-800 bg-emerald-50/80 p-4 font-bold border border-emerald-200/60">
              Outstanding work! All evaluated topics currently meet proficiency targets (&gt;75%).
            </p>
          )}
        </div>
      </div>

      {/* Student Practice Quiz Modal */}
      {selectedPracticeTopic && (
        <StudentPracticeQuizModal
          isOpen={practiceModalOpen}
          onClose={() => setPracticeModalOpen(false)}
          subjectId={selectedPracticeTopic.subjectId}
          subjectName={selectedPracticeTopic.subjectName}
          topicId={selectedPracticeTopic.topicId}
          topicName={selectedPracticeTopic.topicName}
          onMasteryUpdated={(updated) => {
            toast(`Mastery updated for ${updated.topicName} (+boost applied!)`, "success");
            // Refresh data in view
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                masteryHeatmap: prev.masteryHeatmap.map((m) =>
                  m.topicName === updated.topicName
                    ? { ...m, scorePercentage: updated.scorePercentage, level: updated.level }
                    : m
                ),
                weakTopics: prev.weakTopics
                  .map((wt) =>
                    wt.topicName === updated.topicName
                      ? { ...wt, scorePercentage: updated.scorePercentage }
                      : wt
                  )
                  .filter((wt) => wt.scorePercentage < 75),
              };
            });
          }}
        />
      )}
    </div>
  );
}
