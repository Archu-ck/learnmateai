"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Clock,
  CheckSquare,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  LayoutList,
  Layers,
} from "lucide-react";

interface QuestionItem {
  id: string;
  type: string;
  text: string;
  options: string[];
  marks: number;
}

interface TestData {
  id: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
}

export default function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const testId = resolvedParams.id;

  const router = useRouter();
  const { toast } = useToast();

  const [hasStarted, setHasStarted] = useState(false);
  const [test, setTest] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<{
    [questionId: string]: { studentAnswer: string; flagged: boolean };
  }>({});

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800); // 30 mins default
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "all">("single");

  // Initialize or fetch test attempt from server
  const initTest = async () => {
    try {
      setLoading(true);
      const res = await api.post<{
        test: TestData;
        attempt: any;
        questions: QuestionItem[];
      }>(`/api/student/tests/${testId}/start`);

      setTest(res.test);
      setQuestions(res.questions || []);

      if (res.attempt?.status === "submitted" || res.attempt?.status === "auto_submitted") {
        router.replace(`/student/tests/${testId}/results`);
        return;
      }

      const initialMap: any = {};
      for (const a of res.attempt?.answers || []) {
        initialMap[a.questionId] = {
          studentAnswer: a.studentAnswer || "",
          flagged: !!a.flagged,
        };
      }
      setAnswers(initialMap);

      // Server-based timing enforcement
      if (res.attempt?.expiresAt) {
        const remaining = Math.max(
          0,
          Math.floor((new Date(res.attempt.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeftSeconds(remaining);
        if (res.attempt.status === "in_progress") {
          setHasStarted(true);
        }
        if (remaining <= 0) {
          handleSubmitTest();
        }
      } else if (res.test?.durationMinutes) {
        setTimeLeftSeconds(res.test.durationMinutes * 60);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load test", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initTest();
  }, [testId]);

  // Server countdown timer
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest(); // Auto submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted]);

  // Select Answer & Auto Save
  const handleSelectAnswer = async (questionId: string, answer: string) => {
    const updated = {
      ...answers,
      [questionId]: {
        ...(answers[questionId] || {}),
        studentAnswer: answer,
      },
    };
    setAnswers(updated);

    try {
      await api.post(`/api/student/tests/${testId}/answer`, {
        questionId,
        studentAnswer: answer,
        flagged: updated[questionId]?.flagged || false,
      });
    } catch (e) {
      // Background auto-save failure non-fatal
    }
  };

  // Toggle Flag
  const handleToggleFlag = async (questionId: string) => {
    const isCurrentlyFlagged = answers[questionId]?.flagged || false;
    const updated = {
      ...answers,
      [questionId]: {
        ...(answers[questionId] || {}),
        flagged: !isCurrentlyFlagged,
      },
    };
    setAnswers(updated);

    try {
      await api.post(`/api/student/tests/${testId}/answer`, {
        questionId,
        studentAnswer: updated[questionId]?.studentAnswer || "",
        flagged: !isCurrentlyFlagged,
      });
    } catch (e) {
      // Background flag save failure non-fatal
    }
  };

  // Final Submit Test
  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);
      await api.post(`/api/student/tests/${testId}/submit`);
      toast("Test submitted and auto-graded!", "success");
      router.push(`/student/tests/${testId}/results`);
    } catch (err: any) {
      toast(err.message || "Failed to submit test", "error");
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (loading || !test) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center text-slate-400 font-medium text-xs font-sans">
        Loading assessment engine...
      </div>
    );
  }

  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  // Color-coded timer styling based on remaining duration
  let timerStyle = "neu-inset text-slate-700";
  if (timeLeftSeconds <= 60) {
    timerStyle = "bg-rose-100 text-rose-700 border-2 border-rose-300 animate-pulse font-black";
  } else if (timeLeftSeconds <= 300) {
    timerStyle = "bg-amber-100 text-amber-800 border-2 border-amber-300 font-bold";
  }

  // Instructions Screen before Starting
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto my-12 neu-card p-8 sm:p-10 space-y-6 font-sans">
        <div className="border-b border-white/80 pb-4">
          <span className="neu-pill text-indigo-700 bg-indigo-50/80 text-[10px] font-bold uppercase tracking-wider">
            Official Assessment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-2">
            {test.title}
          </h1>
        </div>

        <div className="neu-inset grid grid-cols-2 gap-4 p-4 rounded-2xl text-xs">
          <div>
            <span className="font-bold text-slate-400 block mb-0.5 text-[11px]">Duration:</span>
            <span className="font-extrabold text-slate-800 text-sm">
              {test.durationMinutes} Minutes
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-400 block mb-0.5 text-[11px]">Total Questions:</span>
            <span className="font-extrabold text-slate-800 text-sm">
              {questions.length} Questions
            </span>
          </div>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-600 font-medium list-disc list-inside leading-relaxed">
          <li>The countdown timer starts as soon as you click &quot;Begin Assessment&quot;.</li>
          <li>Your selections are automatically saved in the background as you click options.</li>
          <li>Server-side timing enforces exact duration; refreshing the page will not reset the clock.</li>
          <li>You can flag questions to review before final submission.</li>
          <li>When the timer reaches 00:00, your test will be auto-submitted immediately.</li>
        </ul>

        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setHasStarted(true)}
            className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
          >
            Begin Assessment
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ?.id]?.studentAnswer || "";
  const isCurrentFlagged = answers[currentQ?.id]?.flagged || false;
  const answeredCount = Object.values(answers).filter((a) => a.studentAnswer).length;

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-6 pb-20 font-sans">
      {/* Top Bar: Title, View Switcher & Timer */}
      <div className="neu-card p-4 sm:p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-20">
        <div>
          <h1 className="text-sm font-extrabold text-slate-800 truncate">{test.title}</h1>
          <span className="text-xs text-slate-400 font-medium">
            {answeredCount} of {questions.length} Answered
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle: 1-question or all */}
          <div className="neu-inset p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "single"
                  ? "neu-btn-primary text-white shadow-inner"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers size={13} />
              <span>One by One</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "all"
                  ? "neu-btn-primary text-white shadow-inner"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutList size={13} />
              <span>All Questions</span>
            </button>
          </div>

          {/* Color-coded Timer Display */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${timerStyle}`}
          >
            <Clock size={14} className="shrink-0" />
            <span>{timeFormatted}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
          >
            Finish Test
          </button>
        </div>
      </div>

      {/* Main Layout: Question + Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Questions Area (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          {viewMode === "single" ? (
            /* Single Question View */
            <div className="neu-card p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/80 pb-4">
                <div>
                  <span className="neu-pill text-indigo-700 bg-indigo-50/80 text-[10px] font-bold uppercase tracking-wider">
                    Question {currentIndex + 1} of {questions.length} ({currentQ?.marks} Marks)
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-2.5 leading-relaxed">
                    {currentQ?.text}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isCurrentFlagged
                      ? "neu-btn text-amber-700 bg-amber-50"
                      : "neu-btn text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Flag size={13} />
                  <span>{isCurrentFlagged ? "Flagged" : "Flag"}</span>
                </button>
              </div>

              {/* Options */}
              {currentQ?.options && currentQ.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = currentAnswer === opt;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id, opt)}
                        className={`w-full text-left p-4 rounded-2xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "neu-inset bg-indigo-50/40 text-indigo-900 font-bold border-2 border-indigo-500/50"
                            : "neu-card-sm text-slate-700 font-medium hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg neu-inset flex items-center justify-center text-xs font-black shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="neu-input w-full p-4 text-xs font-medium"
                />
              )}

              {/* Single Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/80">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} /> <span>Previous</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                    className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Next</span> <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Review & Submit</span> <CheckCircle2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* All Questions View */
            <div className="space-y-6">
              {questions.map((q, qIndex) => {
                const ans = answers[q.id]?.studentAnswer || "";
                const isFlg = answers[q.id]?.flagged || false;
                return (
                  <div key={q.id} className="neu-card p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4 border-b border-white/80 pb-3">
                      <div>
                        <span className="neu-pill text-indigo-700 bg-indigo-50/80 text-[10px] font-bold uppercase">
                          Question {qIndex + 1} ({q.marks} Marks)
                        </span>
                        <p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">
                          {q.text}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFlag(q.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isFlg
                            ? "neu-btn text-amber-700 bg-amber-50"
                            : "neu-btn text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Flag size={13} />
                        <span>{isFlg ? "Flagged" : "Flag"}</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = ans === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={`w-full text-left p-3.5 rounded-2xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "neu-inset bg-indigo-50/40 text-indigo-900 font-bold border-2 border-indigo-500/50"
                                : "neu-card-sm text-slate-700 font-medium hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg neu-inset flex items-center justify-center text-xs font-black shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="neu-btn-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Submit Final Assessment</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Navigator (4 cols) */}
        <div className="md:col-span-4 neu-card p-5 space-y-4 h-fit sticky top-24">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Question Navigator
          </h3>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, qIdx) => {
              const isAnswered = !!answers[q.id]?.studentAnswer;
              const isFlagged = !!answers[q.id]?.flagged;
              const isCurrent = qIdx === currentIndex;

              let btnClass = "neu-card-sm text-slate-600";
              if (isFlagged) {
                btnClass = "neu-inset text-amber-700 font-bold bg-amber-50/70";
              } else if (isAnswered) {
                btnClass = "neu-inset text-emerald-700 font-bold bg-emerald-50/70";
              }

              if (viewMode === "single" && isCurrent) {
                btnClass += " ring-2 ring-indigo-500 font-extrabold text-indigo-700";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(qIdx);
                    if (viewMode === "all") {
                      // Scroll to question
                    }
                  }}
                  className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                >
                  {qIdx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/80 space-y-2 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>
                Flagged ({Object.values(answers).filter((a) => a.flagged).length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Unanswered ({questions.length - answeredCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="neu-card max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Confirm Submission</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You have answered {answeredCount} out of {questions.length} questions. Are you ready to submit your test for instant auto-grading?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitTest}
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
              >
                {submitting ? "Submitting..." : "Yes, Submit Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
