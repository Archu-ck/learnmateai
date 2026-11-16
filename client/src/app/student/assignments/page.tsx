"use client";

import { useState } from "react";
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Send,
  X,
  AlertCircle,
} from "lucide-react";
import StatusChip from "@/components/StatusChip";
import AITutorPanel from "@/components/AITutorPanel";

type AssignmentStatus = "Pending" | "In Progress" | "Submitted" | "Graded";

interface Assignment {
  id: number;
  title: string;
  subject: string;
  due: string;
  status: AssignmentStatus;
  description: string;
  estimatedTime: string;
  totalMarks?: number;
  grade?: string;
  feedback?: string;
}

const assignments: Assignment[] = [
  {
    id: 1,
    title: "Quadratic Equations Worksheet",
    subject: "Mathematics",
    due: "Nov 18, 2026",
    status: "Pending",
    description:
      "Solve the set of 20 problems on quadratic equations including factoring, completing the square, and using the quadratic formula. Show all working steps clearly.",
    estimatedTime: "1.5 hours",
    totalMarks: 25,
  },
  {
    id: 2,
    title: "Lab Report: Electromagnetic Induction",
    subject: "Physics",
    due: "Nov 19, 2026",
    status: "In Progress",
    description:
      "Write a detailed lab report on the electromagnetic induction experiment conducted in class. Include observations, calculations of induced EMF, and error analysis.",
    estimatedTime: "2.0 hours",
    totalMarks: 30,
  },
  {
    id: 3,
    title: "Essay: Indian Freedom Struggle (1920-1947)",
    subject: "History",
    due: "Nov 20, 2026",
    status: "Pending",
    description:
      "Write a 1500-word essay on the Indian Freedom Struggle from 1920 to 1947. Discuss the major movements, key leaders, and turning points that led to independence.",
    estimatedTime: "3.0 hours",
    totalMarks: 20,
  },
  {
    id: 4,
    title: "Program: Binary Search Tree in C++",
    subject: "Computer Science",
    due: "Nov 22, 2026",
    status: "Pending",
    description:
      "Implement a Binary Search Tree in C++ with insertion, deletion, and traversal operations (in-order, pre-order, post-order). Include a driver program that demonstrates all operations.",
    estimatedTime: "2.5 hours",
    totalMarks: 30,
  },
  {
    id: 5,
    title: "Organic Chemistry: Reaction Mechanisms",
    subject: "Chemistry",
    due: "Nov 17, 2026",
    status: "Submitted",
    description:
      "Complete the worksheet on SN1 and SN2 reaction mechanisms. Draw all intermediate structures and explain the stereochemistry of each reaction.",
    estimatedTime: "1.0 hour",
    totalMarks: 20,
    feedback: "Submitted on Nov 15. Awaiting faculty evaluation.",
  },
  {
    id: 6,
    title: "Comprehension: The Guide by R.K. Narayan",
    subject: "English",
    due: "Nov 14, 2026",
    status: "Graded",
    description:
      "Answer the comprehension questions from Chapter 5 of The Guide. Analyze the character development of Raju and his transformation throughout the chapter.",
    estimatedTime: "45 minutes",
    totalMarks: 20,
    grade: "18.5 / 20 (92%)",
    feedback: "Excellent character depth and literary vocabulary! Keep up the good work.",
  },
  {
    id: 7,
    title: "Trigonometric Identities Practice",
    subject: "Mathematics",
    due: "Nov 24, 2026",
    status: "Pending",
    description:
      "Prove the 15 trigonometric identities listed in Exercise 3.4. Use standard identities and algebraic manipulation. Neatness and clarity of proof will be graded.",
    estimatedTime: "2.0 hours",
    totalMarks: 20,
  },
  {
    id: 8,
    title: "Map Work: Rivers and Drainage Systems of India",
    subject: "Geography",
    due: "Nov 12, 2026",
    status: "Graded",
    description:
      "Mark and label all major rivers of India on the outline map provided. Include tributaries and indicate the direction of flow.",
    estimatedTime: "30 minutes",
    totalMarks: 15,
    grade: "14 / 15 (93%)",
    feedback: "Accurate cartography and neat labels.",
  },
];

const filters = ["All", "Pending", "In Progress", "Submitted", "Graded"] as const;

export default function AssignmentsPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [submissionText, setSubmissionText] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const filtered =
    activeFilter === "All"
      ? assignments
      : assignments.filter((a) => a.status === activeFilter);

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim()) return;
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 4000);
    setSubmissionText("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header + Neumorphic Filter Bar */}
      <div className="neu-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Assignments &amp; Homework
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Class X-A • Showing {filtered.length} assignments
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 neu-inset rounded-full overflow-x-auto self-start sm:self-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === f
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assignment List */}
        <div className={`${selected ? "lg:col-span-6" : "lg:col-span-12"} space-y-3`}>
          {filtered.map((a) => {
            const isSelected = selectedId === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`neu-card p-5 cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "border-indigo-400/80 bg-white shadow-md ring-2 ring-indigo-500/20 translate-x-1"
                    : "hover:border-slate-300/80 hover:bg-white/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        <span className="font-semibold text-slate-700">{a.subject}</span>
                        {" • "}
                        <span>Due {a.due}</span>
                      </p>
                    </div>
                  </div>

                  <StatusChip status={a.status} />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={12} />
                    <span>Est. {a.estimatedTime}</span>
                  </span>
                  <span
                    className={`font-bold flex items-center gap-0.5 ${
                      isSelected ? "text-indigo-600" : "text-slate-500"
                    }`}
                  >
                    <span>{isSelected ? "Active View" : "Click to view"}</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400">
              <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No assignments found for &ldquo;{activeFilter}&rdquo;.</p>
            </div>
          )}
        </div>

        {/* Right: Detail View Panel */}
        {selected && (
          <div className="lg:col-span-6">
            <div className="neu-card p-6 sm:p-7 sticky top-6 space-y-6 bg-gradient-to-br from-[#f0f3f8] via-[#f7f9fd] to-[#eff3f9]">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                  <span className="neu-pill px-3 py-1 text-[11px] font-bold text-indigo-700 bg-white inline-block mb-2">
                    {selected.subject}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
                    {selected.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-700 cursor-pointer lg:hidden"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="neu-inset p-3 bg-white/70">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{selected.due}</p>
                </div>
                <div className="neu-inset p-3 bg-white/70">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Duration</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{selected.estimatedTime}</p>
                </div>
                <div className="neu-inset p-3 bg-white/70 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    <StatusChip status={selected.status} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Assignment Instructions
                </h3>
                <div className="p-4 rounded-2xl bg-white/80 border border-white/90 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-2xs">
                  {selected.description}
                </div>
              </div>

              {/* Grade / Feedback if Graded */}
              {selected.grade && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 text-xs sm:text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-emerald-800">Grade Awarded:</span>
                    <span className="font-extrabold text-emerald-700 text-base">{selected.grade}</span>
                  </div>
                  {selected.feedback && (
                    <p className="text-emerald-700 text-xs mt-1 leading-relaxed">{selected.feedback}</p>
                  )}
                </div>
              )}

              {/* Submission Area */}
              {(selected.status === "Pending" || selected.status === "In Progress") && (
                <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Your Response &amp; Submission
                  </h3>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    rows={4}
                    placeholder="Type or paste your answers, proofs, or write-up here..."
                    className="neu-input w-full rounded-2xl text-xs sm:text-sm resize-none bg-[#ebf0f6] border border-white/80"
                  />

                  {submittedSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-300 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Assignment submitted successfully! Your teacher will review it.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="neu-btn-primary w-full py-3 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={15} />
                    <span>Submit Assignment for Review</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <AITutorPanel />
    </div>
  );
}
