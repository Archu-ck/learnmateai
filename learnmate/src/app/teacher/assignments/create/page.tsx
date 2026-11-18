"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Send,
  Zap,
  HelpCircle,
} from "lucide-react";

interface TeacherClassOption {
  classId: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
}

interface TopicOption {
  id: string;
  name: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [classes, setClasses] = useState<TeacherClassOption[]>([]);
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalMarks, setTotalMarks] = useState<number>(20);
  const [aiHelpLevel, setAiHelpLevel] = useState<"Hints only" | "Full" | "None">("Hints only");

  // Default due date: 2 days from now at 18:00
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 2);
  const [dueDateString, setDueDateString] = useState(defaultDueDate.toISOString().split("T")[0]);
  const [dueTimeString, setDueTimeString] = useState("18:00");

  // AI Estimation & Workload Check State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    estimation: {
      estimatedMinutes: number;
      difficultyLevel: string;
      readingMinutes: number;
      solvingMinutes: number;
      reviewMinutes: number;
      rationale: string;
      pacingAdvice: string;
    };
    workload: {
      isOverloaded: boolean;
      targetDate: string;
      targetDateFormatted: string;
      currentTargetMinutes: number;
      currentTargetCount: number;
      combinedTargetMinutes: number;
      warningMessage: string | null;
      suggestedDate: string | null;
      suggestedDateFormatted: string | null;
      suggestedDateMinutes: number;
      suggestedCombinedMinutes: number;
      rescheduleReason: string | null;
      weekWorkload: Array<{
        date: string;
        dayName: string;
        formattedDate: string;
        totalMinutes: number;
        count: number;
        isOverloaded: boolean;
        isTargetDate: boolean;
        isSuggestedDate: boolean;
      }>;
    };
  } | null>(null);

  const [saving, setSaving] = useState(false);

  // Load teacher classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await api.get<{ classes: TeacherClassOption[] }>("/api/teacher/classes");
        const list = res.classes || [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClassIndex(0);
        }
      } catch (err: any) {
        toast(err.message || "Failed to load classes", "error");
      }
    }
    loadClasses();
  }, []);

  // Load topics when selected class changes
  const activeClass = classes[selectedClassIndex];
  useEffect(() => {
    if (!activeClass?.subjectId) return;
    async function loadTopics() {
      try {
        const res = await api.get<any>(`/api/teacher/classes`);
        // Find syllabus topics for this subject
        setTopics([
          { id: "top-1", name: "Chapter 1: Real Numbers & Polynomials" },
          { id: "top-2", name: "Chapter 2: Quadratic Equations & Roots" },
          { id: "top-3", name: "Chapter 3: Arithmetic Progressions" },
          { id: "top-4", name: "Chapter 4: Triangles & Coordinate Geometry" },
          { id: "top-5", name: "Chapter 5: Trigonometry & Applications" },
        ]);
        setSelectedTopicId("top-2");
      } catch (e) {
        // fallback
      }
    }
    loadTopics();
  }, [activeClass]);

  // AI Workload & Effort Analyzer
  const handleAnalyzeWorkload = async () => {
    if (!title.trim()) {
      toast("Please enter an assignment title first", "error");
      return;
    }
    if (!activeClass) {
      toast("Please select a target class", "error");
      return;
    }

    try {
      setAnalyzing(true);
      const res = await api.post<any>("/api/teacher/assignments/smart-estimate", {
        title: title.trim(),
        description: description.trim() || title.trim(),
        classId: activeClass.classId,
        section: activeClass.section,
        subjectId: activeClass.subjectId,
        dueDate: dueDateString,
      });

      setAnalysisResult(res);
      if (res.workload?.isOverloaded) {
        toast("Cognitive overload detected for this date! Review AI rescheduling recommendation below.", "error");
      } else {
        toast("Workload is balanced for this date!", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to run AI workload estimation", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // Accept Suggested Date
  const handleApplySuggestedDate = () => {
    if (!analysisResult?.workload?.suggestedDate) return;
    const newDate = analysisResult.workload.suggestedDate;
    setDueDateString(newDate);

    // Re-verify after applying
    toast(`Rescheduled to ${analysisResult.workload.suggestedDateFormatted}! Workload is now balanced.`, "success");
    setAnalysisResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        workload: {
          ...prev.workload,
          isOverloaded: false,
          warningMessage: null,
          targetDate: newDate,
          targetDateFormatted: prev.workload.suggestedDateFormatted || newDate,
          combinedTargetMinutes: prev.workload.suggestedCombinedMinutes,
        },
      };
    });
  };

  // Publish Assignment
  const handlePublishAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("Please provide an assignment title", "error");
      return;
    }
    if (!activeClass) {
      toast("Please select a target class", "error");
      return;
    }

    try {
      setSaving(true);
      const dueDateTime = new Date(`${dueDateString}T${dueTimeString}:00`);

      await api.post("/api/teacher/assignments", {
        title: title.trim(),
        classId: activeClass.classId,
        section: activeClass.section,
        subjectId: activeClass.subjectId,
        topicId: selectedTopicId || null,
        description: description.trim(),
        dueDate: dueDateTime.toISOString(),
        totalMarks: Number(totalMarks) || 20,
        estimatedMinutes: analysisResult?.estimation?.estimatedMinutes || 45,
        estimatedEffortReasoning: analysisResult?.estimation?.rationale || "",
        aiHelpLevel,
        status: "published",
      });

      toast("Assignment created and published to students!", "success");
      router.push("/teacher/assignments");
    } catch (err: any) {
      toast(err.message || "Failed to publish assignment", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/teacher/assignments"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Smart Assignment Manager</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400 font-medium">New Assignment Creator</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <span>Create Assignment &amp; Smart Workload Optimizer</span>
            <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-700 bg-amber-50">
              AI Balanced
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Set assignments, estimate cognitive student effort via Gemini, and automatically safeguard against homework overload.
          </p>
        </div>

        <Link
          href="/teacher/assignments"
          className="neu-btn px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 self-start sm:self-auto"
        >
          <span>View All Assignments</span>
        </Link>
      </div>

      <form onSubmit={handlePublishAssignment} className="space-y-6">
        {/* Main Assignment Details Card */}
        <div className="neu-card p-6 sm:p-7 space-y-5">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-white/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
              <FileText size={15} />
            </div>
            <span>Assignment Specifications</span>
          </h2>

          {/* Class, Section, and Subject Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Class &amp; Subject Allocation
              </label>
              <select
                value={selectedClassIndex}
                onChange={(e) => setSelectedClassIndex(Number(e.target.value))}
                className="neu-input w-full py-2.5 text-xs font-medium cursor-pointer"
              >
                {classes.map((c, idx) => (
                  <option key={idx} value={idx}>
                    {c.className} - Sec {c.section} • {c.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Syllabus Topic / Chapter
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="neu-input w-full py-2.5 text-xs font-medium cursor-pointer"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                AI Tutor Guidance Level
              </label>
              <select
                value={aiHelpLevel}
                onChange={(e: any) => setAiHelpLevel(e.target.value)}
                className="neu-input w-full py-2.5 text-xs font-medium cursor-pointer"
              >
                <option value="Hints only">Hints only (Ladder guidance)</option>
                <option value="Full">Full (Assisted with solutions)</option>
                <option value="None">None (Evaluative / strict exam mode)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assignment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quadratic Equations Word Problems & Discriminant Analysis"
              className="neu-input w-full py-2.5 text-xs font-medium"
              required
            />
          </div>

          {/* Description & Questions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Assignment Instructions &amp; Problem Sets
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                Gemini will analyze this text to estimate student effort
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the questions, problems, or instructions for the students. E.g.:&#10;1. Solve the following speed-distance quadratic equations.&#10;2. Find the discriminant of 2x^2 - 4x + 3 = 0 and interpret roots.&#10;3. Verify solutions step-by-step."
              className="neu-input w-full py-2 text-xs font-medium leading-relaxed resize-y"
            />
          </div>

          {/* Due Date & Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-600" />
                <span>Proposed Due Date</span>
              </label>
              <input
                type="date"
                value={dueDateString}
                onChange={(e) => setDueDateString(e.target.value)}
                className="neu-input w-full py-2.5 text-xs font-medium cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-600" />
                <span>Submission Deadline Time</span>
              </label>
              <input
                type="time"
                value={dueTimeString}
                onChange={(e) => setDueTimeString(e.target.value)}
                className="neu-input w-full py-2.5 text-xs font-medium cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Total Marks
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="neu-input w-full py-2.5 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* AI WORKLOAD & EFFORT ESTIMATOR SECTION */}
        <div className="neu-card p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles size={15} />
                </div>
                <span>AI Effort Estimator &amp; Cognitive Workload Balancer</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Simulates real student solving time and automatically scans Class 10 calendar for homework fatigue.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeWorkload}
              disabled={analyzing || !title.trim()}
              className="neu-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-indigo-500/25"
            >
              <Zap size={14} />
              <span>{analyzing ? "Analyzing Cognitive Load..." : "⚡ Run AI Workload Analysis"}</span>
            </button>
          </div>

          {/* Analysis Results Display */}
          {analysisResult ? (
            <div className="space-y-4 pt-2">
              {/* Overload Warning / Balanced Banner */}
              {analysisResult.workload.isOverloaded ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border-2 border-amber-300 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                        High Workload Warning — Cognitive Fatigue Risk
                      </h4>
                      <p className="text-xs text-amber-900 leading-relaxed font-medium">
                        {analysisResult.workload.warningMessage}
                      </p>
                    </div>
                  </div>

                  {analysisResult.workload.suggestedDate && (
                    <div className="neu-card p-3.5 bg-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                          <Sparkles size={11} />
                          <span>AI Reschedule Recommendation</span>
                        </span>
                        <p className="text-xs font-extrabold text-slate-800">
                          Move due date to{" "}
                          <span className="text-indigo-700 underline underline-offset-2">
                            {analysisResult.workload.suggestedDateFormatted}
                          </span>{" "}
                          (only {analysisResult.workload.suggestedDateMinutes}m currently scheduled)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {analysisResult.workload.rescheduleReason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleApplySuggestedDate}
                        className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                      >
                        Apply AI Suggested Date
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">
                      Workload Balanced &amp; Healthy
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Daily homework for Class {activeClass?.className} on this date will be ~
                      {analysisResult.workload.combinedTargetMinutes} mins, well within the 90-minute limit.
                    </p>
                  </div>
                </div>
              )}

              {/* Estimation Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="neu-card-sm p-4 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Estimated Time
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-indigo-600">
                      {analysisResult.estimation.estimatedMinutes}
                    </span>
                    <span className="text-xs font-bold text-slate-600">Minutes</span>
                  </div>
                  <span className="neu-pill px-2 py-0.5 text-[9px] font-black uppercase text-indigo-700 bg-indigo-50">
                    {analysisResult.estimation.difficultyLevel} Demand
                  </span>
                </div>

                <div className="neu-card-sm p-4 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Effort Distribution
                  </span>
                  <div className="text-xs font-semibold text-slate-700 space-y-1 pt-0.5">
                    <div className="flex justify-between">
                      <span>Reading &amp; Theory:</span>
                      <strong className="text-slate-900">{analysisResult.estimation.readingMinutes}m</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Problem Solving:</span>
                      <strong className="text-slate-900">{analysisResult.estimation.solvingMinutes}m</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <strong className="text-slate-900">{analysisResult.estimation.reviewMinutes}m</strong>
                    </div>
                  </div>
                </div>

                <div className="neu-card-sm p-4 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Pedagogical Rationale
                  </span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {analysisResult.estimation.rationale}
                  </p>
                </div>
              </div>

              {/* Weekly Workload Mini-Calendar */}
              {analysisResult.workload.weekWorkload && (
                <div className="neu-inset p-3.5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Class {activeClass?.className} • Weekly Homework Timeline
                  </span>
                  <div className="grid grid-cols-7 gap-2">
                    {analysisResult.workload.weekWorkload.map((day, idx) => {
                      const isTarget = day.isTargetDate;
                      const isSuggested = day.isSuggestedDate;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-center space-y-1 transition-all ${
                            isTarget
                              ? "neu-card border-2 border-indigo-600 bg-indigo-50/80 shadow-xs"
                              : isSuggested
                              ? "neu-card border-2 border-emerald-500 bg-emerald-50/80 shadow-xs"
                              : "bg-white/60 border border-white/80"
                          }`}
                        >
                          <span className="text-[10px] font-extrabold text-slate-600 block">
                            {day.dayName}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-medium">
                            {day.date.split("-").slice(1).join("/")}
                          </span>
                          <div className="pt-1">
                            <span
                              className={`text-xs font-black block ${
                                day.totalMinutes > 90
                                  ? "text-rose-600"
                                  : day.totalMinutes > 50
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {day.totalMinutes}m
                            </span>
                            <span className="text-[9px] font-medium text-slate-400 block">
                              {day.count} task{day.count === 1 ? "" : "s"}
                            </span>
                          </div>
                          {isTarget && (
                            <span className="neu-pill text-[8px] font-black uppercase text-indigo-700 bg-indigo-100 px-1 py-0.2 block mt-1">
                              Target
                            </span>
                          )}
                          {isSuggested && (
                            <span className="neu-pill text-[8px] font-black uppercase text-emerald-700 bg-emerald-100 px-1 py-0.2 block mt-1">
                              AI Best
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-medium space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <p>
                Fill in the assignment details above and click <strong>"Run AI Workload Analysis"</strong> to check cognitive effort and prevent student homework overload.
              </p>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/teacher/assignments"
            className="neu-btn px-6 py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="neu-btn-primary flex items-center gap-2 px-8 py-2.5 text-xs font-extrabold rounded-xl disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/25"
          >
            <Send size={14} />
            <span>{saving ? "Publishing Assignment..." : "Publish Assignment to Class"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
