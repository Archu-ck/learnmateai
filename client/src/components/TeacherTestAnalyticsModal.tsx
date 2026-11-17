"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BarChart3,
  Award,
  Users,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";

interface QuestionAnalytics {
  id: string;
  index: number;
  text: string;
  type: string;
  marks: number;
  totalAnswered: number;
  correctCount: number;
  accuracyPercentage: number;
  difficultyRating: "Easy" | "Moderate" | "Difficult";
}

interface StudentAttempt {
  studentId: string;
  studentName: string;
  email: string;
  rollNumber: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  submittedAt: string | null;
  durationMinutes: number;
}

interface AnalyticsData {
  test: {
    id: string;
    title: string;
    totalMarks: number;
    durationMinutes: number;
    subjectName: string;
    className: string;
    section: string;
    createdAt: string;
  };
  summary: {
    totalStudents: number;
    attemptsCount: number;
    classAverage: number;
    highestScore: number;
    lowestScore: number;
    passPercentage: number;
    scoreDistribution: {
      "90-100%": number;
      "75-89%": number;
      "50-74%": number;
      "Below 50%": number;
    };
  };
  questionsAnalytics: QuestionAnalytics[];
  studentAttempts: StudentAttempt[];
}

interface TeacherTestAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
}

export default function TeacherTestAnalyticsModal({
  isOpen,
  onClose,
  testId,
}: TeacherTestAnalyticsModalProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "students">("overview");

  useEffect(() => {
    if (!isOpen || !testId) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get<AnalyticsData>(`/api/teacher/tests/${testId}/analytics`);
        setData(res);
      } catch (err) {
        console.error("Failed to load test analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isOpen, testId]);

  if (!isOpen) return null;

  // CSV Export helper
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Roll No", "Student Name", "Email", "Status", "Score", "Total Marks", "Percentage", "Submitted At"],
      ...data.studentAttempts.map((s) => [
        s.rollNumber,
        `"${s.studentName}"`,
        s.email,
        s.status,
        s.score,
        s.totalMarks,
        `${s.percentage}%`,
        s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "N/A",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${data.test.title.replace(/\s+/g, "_")}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="neu-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-indigo-600">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">
                  {data?.test.title || "Test Analytics & Insights"}
                </h3>
                {data?.test.section && (
                  <span className="neu-pill px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50">
                    Section {data.test.section}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {data?.test.subjectName} • {data?.test.className} • {data?.test.durationMinutes} Mins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-indigo-600"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="neu-circle p-2 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex gap-2 border-b border-white/80 text-xs font-bold">
          {(["overview", "questions", "students"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-3 capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-700 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "overview" ? "Performance Overview" : tab === "questions" ? "Per-Question Accuracy" : "Student Attempts Roster"}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading || !data ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Aggregating test metrics & score distributions...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="neu-card-sm p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Class Average</span>
                      <p className="text-xl font-black text-indigo-600 mt-1">{data.summary.classAverage}%</p>
                      <span className="text-[11px] text-slate-400 font-medium">All attempts</span>
                    </div>

                    <div className="neu-card-sm p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Completion Rate</span>
                      <p className="text-xl font-black text-slate-800 mt-1">
                        {data.summary.attemptsCount} / {data.summary.totalStudents}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {Math.round((data.summary.attemptsCount / (data.summary.totalStudents || 1)) * 100)}% submitted
                      </span>
                    </div>

                    <div className="neu-card-sm p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Highest Score</span>
                      <p className="text-xl font-black text-emerald-600 mt-1">
                        {data.summary.highestScore} / {data.test.totalMarks}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {Math.round((data.summary.highestScore / (data.test.totalMarks || 1)) * 100)}%
                      </span>
                    </div>

                    <div className="neu-card-sm p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pass Rate (≥50%)</span>
                      <p className="text-xl font-black text-amber-600 mt-1">{data.summary.passPercentage}%</p>
                      <span className="text-[11px] text-slate-400 font-medium">Proficiency standard</span>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div className="neu-card p-5 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Score Distribution
                    </h4>
                    <div className="space-y-2.5">
                      {Object.entries(data.summary.scoreDistribution).map(([bracket, count]) => {
                        const pct = Math.round(
                          (count / (data.summary.attemptsCount || 1)) * 100
                        );
                        let barColor = "bg-indigo-600";
                        if (bracket === "90-100%") barColor = "bg-emerald-500";
                        if (bracket === "Below 50%") barColor = "bg-rose-500";

                        return (
                          <div key={bracket} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>{bracket}</span>
                              <span>
                                {count} Students ({pct}%)
                              </span>
                            </div>
                            <div className="neu-inset h-2 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUESTIONS ACCURACY */}
              {activeTab === "questions" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Question Breakdown</span>
                    <span>Class Accuracy</span>
                  </div>

                  {data.questionsAnalytics.map((q) => {
                    let diffBadge = "bg-emerald-50 text-emerald-700";
                    if (q.difficultyRating === "Moderate") diffBadge = "bg-indigo-50 text-indigo-700";
                    if (q.difficultyRating === "Difficult") diffBadge = "bg-rose-50 text-rose-700";

                    return (
                      <div key={q.id} className="neu-card-sm p-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-800">
                                Q{q.index} ({q.marks} Marks)
                              </span>
                              <span className={`neu-pill px-2 py-0.5 text-[10px] font-bold ${diffBadge}`}>
                                {q.difficultyRating}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              {q.text}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-indigo-700">
                              {q.accuracyPercentage}%
                            </span>
                            <span className="block text-[10px] text-slate-400 font-medium">
                              {q.correctCount}/{q.totalAnswered} Correct
                            </span>
                          </div>
                        </div>

                        <div className="neu-inset h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              q.accuracyPercentage >= 75
                                ? "bg-emerald-500"
                                : q.accuracyPercentage >= 45
                                ? "bg-indigo-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${q.accuracyPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: STUDENT ROSTER */}
              {activeTab === "students" && (
                <div className="neu-card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Grade %</th>
                        <th className="py-3 px-4 text-right">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/60">
                      {data.studentAttempts.map((s) => (
                        <tr key={s.studentId} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">{s.studentName}</td>
                          <td className="py-3 px-4 font-medium text-slate-500">{s.rollNumber}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`neu-pill px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                s.status === "submitted" || s.status === "auto_submitted"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : s.status === "in_progress"
                                  ? "bg-indigo-50 text-indigo-800"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {s.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-700">
                            {s.score} / {s.totalMarks}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-black ${
                                s.percentage >= 80
                                  ? "text-emerald-600"
                                  : s.percentage >= 60
                                  ? "text-indigo-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {s.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 font-medium">
                            {s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
