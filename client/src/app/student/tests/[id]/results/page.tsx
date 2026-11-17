"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import StudentPracticeQuizModal from "@/components/StudentPracticeQuizModal";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bot,
  ChevronLeft,
  Sparkles,
  BarChart3,
  BookOpen,
  ArrowRight,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

interface TestResultsData {
  test: {
    id: string;
    title: string;
    subjectId?: string;
    totalMarks: number;
  };
  attempt: {
    score: number;
    totalMarks: number;
    submittedAt: string;
    percentage: number;
  };
  reviewQuestions: Array<{
    id: string;
    text: string;
    type: string;
    options: string[];
    correctAnswer: string;
    studentAnswer: string;
    marksAwarded: number;
    totalMarks: number;
    explanation: string;
    topicName: string;
  }>;
  topicBreakdown: Array<{
    topic: string;
    totalQuestions: number;
    correct: number;
    marksScored: number;
    totalMarks: number;
  }>;
}

export default function TestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const testId = resolvedParams.id;

  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<TestResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Mistake Explanation Modal / State
  const [explainingQuestionId, setExplainingQuestionId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<{ [qId: string]: any }>({});
  const [aiLoading, setAiLoading] = useState(false);

  // Practice Weak Topic Modal State
  const [practiceTopic, setPracticeTopic] = useState<{
    subjectId: string;
    topicName: string;
  } | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get<TestResultsData>(`/api/student/tests/${testId}/results`);
        setData(res);
      } catch (err: any) {
        toast(err.message || "Failed to load test results", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId]);

  // AI Explain Mistake Handler (Calls /api/ai/explain-mistake)
  const handleExplainMistake = async (q: any) => {
    try {
      setExplainingQuestionId(q.id);
      setAiLoading(true);
      const res = await api.post("/api/ai/explain-mistake", {
        questionText: q.text,
        studentAnswer: q.studentAnswer,
        correctAnswer: q.correctAnswer,
        topicName: q.topicName,
      });

      setAiExplanations((prev) => ({
        ...prev,
        [q.id]: res,
      }));
      toast("AI analysis generated for this question", "success");
    } catch (err: any) {
      toast(err.message || "Failed to get AI explanation", "error");
    } finally {
      setAiLoading(false);
      setExplainingQuestionId(null);
    }
  };

  // Pre-fill Ask AI Doubt Chat
  const handleExplainInAskAI = (q: any, idx: number) => {
    if (!data?.test.subjectId) {
      toast("Could not navigate to Ask AI tab", "error");
      return;
    }
    const promptText = `Can you explain Question ${idx + 1} from our test?
Question: "${q.text}"
I chose: "${q.studentAnswer || "No answer"}"
The correct answer is: "${q.correctAnswer}"
Why is ${q.correctAnswer} correct, and how should I approach this problem?`;

    router.push(
      `/student/subjects/${data.test.subjectId}?askAI=true&question=${encodeURIComponent(
        promptText
      )}`
    );
  };

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center text-slate-400 font-medium text-xs font-sans">
        Loading test results...
      </div>
    );
  }

  const { test, attempt, reviewQuestions, topicBreakdown } = data;

  const correctCount = reviewQuestions.filter((q) => q.marksAwarded === q.totalMarks).length;
  const incorrectCount = reviewQuestions.filter(
    (q) => q.studentAnswer && q.marksAwarded !== q.totalMarks
  ).length;
  const unansweredCount = reviewQuestions.filter((q) => !q.studentAnswer).length;

  const weakTopics = topicBreakdown.filter(
    (t) => Math.round((t.marksScored / (t.totalMarks || 1)) * 100) < 75
  );

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-7 pb-20 font-sans">
      {/* Back Link */}
      <div>
        <Link
          href="/student/tests"
          className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 hover:text-indigo-600"
        >
          <ChevronLeft size={14} />
          <span>Back to Tests</span>
        </Link>
      </div>

      {/* Score Banner & Key Metrics */}
      <div className="neu-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/80 pb-6">
          <div className="space-y-1.5">
            <span className="neu-pill text-indigo-700 bg-indigo-50/80 text-[10px] font-bold uppercase tracking-wider">
              Assessment Results
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {test.title}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Submitted on {new Date(attempt.submittedAt).toLocaleString()}
            </p>
          </div>

          <div className="neu-inset p-4 rounded-2xl flex items-center gap-4 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Score
              </span>
              <span className="text-2xl font-black text-slate-800">
                {attempt.score}{" "}
                <span className="text-sm font-normal text-slate-400">/ {attempt.totalMarks}</span>
              </span>
            </div>

            <div
              className={`px-3.5 py-2 rounded-xl text-lg font-black ${
                attempt.percentage >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : attempt.percentage >= 60
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {attempt.percentage}%
            </div>
          </div>
        </div>

        {/* Detailed Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="neu-card-sm p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Correct</span>
              <p className="text-sm font-extrabold text-slate-800">{correctCount}</p>
            </div>
          </div>

          <div className="neu-card-sm p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-rose-600 shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Incorrect</span>
              <p className="text-sm font-extrabold text-slate-800">{incorrectCount}</p>
            </div>
          </div>

          <div className="neu-card-sm p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-slate-400 shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Unanswered</span>
              <p className="text-sm font-extrabold text-slate-800">{unansweredCount}</p>
            </div>
          </div>

          <div className="neu-card-sm p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-indigo-600 shrink-0">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Marks Awarded</span>
              <p className="text-sm font-extrabold text-slate-800">
                {attempt.score} / {attempt.totalMarks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic-Wise Breakdown */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/80">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <div className="neu-circle w-8 h-8 text-indigo-600">
                <BarChart3 size={16} />
              </div>
              <span>Topic-Wise Performance Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Accuracy and mastery by curriculum unit
            </p>
          </div>

          {weakTopics.length > 0 && test.subjectId && (
            <button
              type="button"
              onClick={() => {
                setPracticeTopic({
                  subjectId: test.subjectId!,
                  topicName: weakTopics[0].topic,
                });
              }}
              className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Bot size={14} />
              <span>Practise Weak Topics ({weakTopics.length})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
          {topicBreakdown.map((t, idx) => {
            const topicPercent = Math.round((t.marksScored / (t.totalMarks || 1)) * 100);
            return (
              <div key={idx} className="neu-card-sm p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 truncate">{t.topic}</h3>
                  <span className="text-xs font-black text-indigo-700">{topicPercent}%</span>
                </div>

                <div className="neu-inset h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full ${
                      topicPercent >= 80
                        ? "bg-emerald-500"
                        : topicPercent >= 60
                        ? "bg-indigo-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${topicPercent}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-400 font-medium flex justify-between items-center">
                  <span>
                    {t.correct} of {t.totalQuestions} Correct
                  </span>
                  {topicPercent < 75 && test.subjectId && (
                    <button
                      type="button"
                      onClick={() =>
                        setPracticeTopic({
                          subjectId: test.subjectId!,
                          topicName: t.topic,
                        })
                      }
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Practise</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Question Review */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-800">Per-Question Review & Explanations</h2>

        {reviewQuestions.map((q, idx) => {
          const isCorrect = q.marksAwarded === q.totalMarks;
          const aiExp = aiExplanations[q.id];

          return (
            <div key={q.id} className="neu-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-400">
                      Question {idx + 1} • {q.topicName}
                    </span>
                    {isCorrect ? (
                      <span className="neu-pill text-emerald-700 bg-emerald-50 text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Correct (+{q.marksAwarded} Marks)
                      </span>
                    ) : (
                      <span className="neu-pill text-rose-700 bg-rose-50 text-[10px] font-bold inline-flex items-center gap-1">
                        <XCircle size={12} className="text-rose-600" /> Needs Review ({q.marksAwarded}/{q.totalMarks} Marks)
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-slate-800 leading-relaxed">{q.text}</p>
                </div>

                {/* Explanations and Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleExplainInAskAI(q, idx)}
                    className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-1.5 hover:text-indigo-900 cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>Explain this more</span>
                  </button>

                  {!isCorrect && !aiExp && (
                    <button
                      type="button"
                      onClick={() => handleExplainMistake(q)}
                      disabled={aiLoading && explainingQuestionId === q.id}
                      className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-slate-800 cursor-pointer"
                    >
                      <Bot size={13} />
                      <span>
                        {aiLoading && explainingQuestionId === q.id
                          ? "Analyzing..."
                          : "AI Breakdown"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="neu-inset p-3.5 rounded-xl font-medium">
                  <span className="font-bold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">
                    Your Answer:
                  </span>
                  <span className={isCorrect ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>
                    {q.studentAnswer || "(No answer selected)"}
                  </span>
                </div>

                <div className="neu-inset p-3.5 rounded-xl font-medium">
                  <span className="font-bold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">
                    Correct Answer:
                  </span>
                  <span className="font-bold text-emerald-700">{q.correctAnswer}</span>
                </div>
              </div>

              {/* Syllabus Explanation */}
              {q.explanation && (
                <div className="neu-card-sm p-3.5 text-xs text-slate-600 font-medium leading-relaxed">
                  <strong className="text-slate-800">Concept Explanation: </strong>
                  {q.explanation}
                </div>
              )}

              {/* AI Generated Detailed Mistake Analysis */}
              {aiExp && (
                <div className="neu-card-sm p-4.5 space-y-2 text-xs border border-indigo-200/60 bg-indigo-50/40">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>AI Tutor Breakdown</span>
                    </span>
                    <span className="neu-pill text-[10px] font-bold text-indigo-700 bg-white">
                      AI Generated
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-medium">{aiExp.whyWrong}</p>

                  <div className="neu-inset p-3 rounded-xl">
                    <span className="font-bold text-indigo-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                      Key Takeaway to Remember:
                    </span>
                    <span className="text-slate-700 font-medium">{aiExp.keyRule}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adaptive Practice Quiz Modal for Weak Topics */}
      {practiceTopic && (
        <StudentPracticeQuizModal
          isOpen={!!practiceTopic}
          onClose={() => setPracticeTopic(null)}
          subjectId={practiceTopic.subjectId}
          topicName={practiceTopic.topicName}
          onMasteryUpdated={(newMastery) => {
            toast(`Practice completed! Mastery updated for ${newMastery.topicName}`, "success");
          }}
        />
      )}
    </div>
  );
}
