"useclient";

import React, { useState } from "react";
import {
  X,
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  HelpCircle,
  BookOpen,
} from "lucide-react";

interface Question {
  id?: string;
  text: string;
  options: string[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic?: string;
}

interface StudentPracticeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  topics?: Array<{ id: string; name: string }>;
  onMasteryUpdated?: (newMastery: any) => void;
}

export default function StudentPracticeQuizModal({
  isOpen,
  onClose,
  subjectId,
  subjectName = "Subject",
  topicId,
  topicName = "Topic Revision",
  topics = [],
  onMasteryUpdated,
}: StudentPracticeQuizModalProps) {
  const [step, setStep] = useState<"configure" | "loading" | "quiz" | "summary">("configure");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: "A" | "B" | "C" | "D" }>({});
  const [revealed, setRevealed] = useState<{ [qIndex: number]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [masteryResult, setMasteryResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Multi-chapter selection state
  const [availableTopics, setAvailableTopics] = useState<Array<{ id: string; name: string }>>(topics || []);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() => {
    if (topicId) return [topicId];
    if (topics && topics.length > 0) return topics.map((t) => t.id);
    return [];
  });

  // Fetch or sync topics when modal opens
  React.useEffect(() => {
    if (topics && topics.length > 0) {
      setAvailableTopics(topics);
      if (selectedTopicIds.length === 0) {
        if (topicId) setSelectedTopicIds([topicId]);
        else setSelectedTopicIds(topics.map((t) => t.id));
      }
    } else if (subjectId && isOpen) {
      fetch(`/api/student/subjects/${subjectId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.topics && d.topics.length > 0) {
            const mapped = d.topics.map((t: any) => ({ id: t.id || t._id, name: t.name }));
            setAvailableTopics(mapped);
            if (selectedTopicIds.length === 0) {
              if (topicId) setSelectedTopicIds([topicId]);
              else setSelectedTopicIds(mapped.map((t: any) => t.id));
            }
          }
        })
        .catch(() => {});
    }
  }, [subjectId, topics, topicId, isOpen]);

  if (!isOpen) return null;

  const handleStartQuiz = async () => {
    if (availableTopics.length > 0 && selectedTopicIds.length === 0) {
      setErrorMsg("Please select at least one chapter to practice.");
      return;
    }

    setErrorMsg("");
    setStep("loading");
    try {
      const res = await fetch("/api/student/practice-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          topicIds: selectedTopicIds,
          topicId: selectedTopicIds[0] || topicId,
          count: questionCount,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate practice quiz");
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No practice questions were returned. Please try again.");
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setRevealed({});
      setStep("quiz");
    } catch (err: any) {
      console.error("Practice quiz generation failed:", err);
      setErrorMsg(err.message || "Could not generate quiz. Please retry.");
      setStep("configure");
    }
  };

  const currentQ = questions[currentIndex];
  const optionLetters: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

  const handleSelectOption = (letter: "A" | "B" | "C" | "D") => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    setStep("summary");

    // Calculate score
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOption) {
        correct++;
      }
    });

    const testedChapters = Array.from(
      new Set(questions.map((q) => q.topic).filter(Boolean))
    );

    try {
      const res = await fetch("/api/student/practice-quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          topicName,
          topicNames: testedChapters.length > 0 ? testedChapters : [topicName],
          totalQuestions: questions.length,
          correctCount: correct,
        }),
      });
      const data = await res.json();
      if (res.ok && data.updatedMastery) {
        setMasteryResult(data.updatedMastery);
        if (onMasteryUpdated) {
          onMasteryUpdated(data.updatedMastery);
        }
      }
    } catch (err) {
      console.error("Failed to update mastery:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOption) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / (questions.length || 1)) * 100),
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="neu-card w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-indigo-600">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">AI Practice Quiz</h3>
                <span className="neu-pill px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50">
                  Private Session
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {subjectName} • {topicName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-circle p-2 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="neu-inset p-3 rounded-xl bg-rose-50/60 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <XCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CONFIGURE */}
          {step === "configure" && (
            <div className="space-y-5">
              <div className="neu-card-sm p-4 space-y-2 border-indigo-100/50 bg-indigo-50/20">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
                  <Sparkles size={16} className="text-indigo-600" />
                  <span>Targeted Practice Without Exam Pressure</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Practice tests do not affect your official report card or gradebook. They help strengthen weak concepts and lightly boost your topic mastery profile.
                </p>
              </div>

              {/* Multi-Chapter Selector */}
              {availableTopics.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-indigo-600" />
                      <span>Select Chapters to Practice</span>
                      <span className="neu-pill px-2 py-0.5 text-[10px] font-black text-indigo-700 bg-indigo-50">
                        {selectedTopicIds.length} of {availableTopics.length} selected
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTopicIds(availableTopics.map((t) => t.id))}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer px-2 py-0.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTopicIds([])}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-slim">
                    {availableTopics.map((top) => {
                      const isSelected = selectedTopicIds.includes(top.id);
                      return (
                        <button
                          key={top.id}
                          type="button"
                          onClick={() => {
                            setSelectedTopicIds((prev) =>
                              prev.includes(top.id) ? prev.filter((id) => id !== top.id) : [...prev, top.id]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "neu-btn-primary text-white shadow-xs"
                              : "neu-btn text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {isSelected && <CheckCircle2 size={12} />}
                          <span>{top.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedTopicIds.length === 0 && (
                    <p className="text-[11px] font-semibold text-rose-500">
                      Please select at least one chapter to generate questions.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Number of Questions</label>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                        questionCount === num
                          ? "neu-btn-primary shadow-inner"
                          : "neu-btn text-slate-700"
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["easy", "medium", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2.5 rounded-xl font-extrabold text-xs capitalize transition-all ${
                        difficulty === diff
                          ? "neu-btn-primary shadow-inner"
                          : "neu-btn text-slate-700"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
                >
                  <Sparkles size={15} />
                  <span>Generate Practice Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl neu-inset flex items-center justify-center text-indigo-600 animate-pulse">
                <Sparkles size={28} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">Generating Questions...</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  VidyaAI is curating {questionCount} questions across {selectedTopicIds.length > 1 ? `${selectedTopicIds.length} selected chapters` : (topicName || "your syllabus")} tailored to your grade level.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: ACTIVE QUIZ */}
          {step === "quiz" && currentQ && (
            <div className="space-y-5">
              {/* Question Navigator Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((_, qIdx) => {
                    const isAnswered = !!selectedAnswers[qIdx];
                    const isCurrent = qIdx === currentIndex;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setCurrentIndex(qIdx)}
                        className={`w-7 h-7 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                            : isAnswered
                            ? "neu-btn text-indigo-700 bg-indigo-50/80 font-bold"
                            : "neu-btn text-slate-500"
                        }`}
                        title={`Go to Question ${qIdx + 1}`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>

                <span className="neu-pill px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700">
                  {difficulty.toUpperCase()}
                </span>
              </div>

              {/* Progress and Counter */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  {currentQ.topic && (
                    <span className="neu-pill px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 flex items-center gap-1">
                      <BookOpen size={10} />
                      <span>{currentQ.topic}</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {Object.keys(selectedAnswers).length} of {questions.length} answered
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="neu-card-sm p-4">
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  {currentQ.text}
                </p>
              </div>

              {/* Options (One by One, no answer reveal during test) */}
              <div className="space-y-2.5">
                {currentQ.options.map((optText, optIdx) => {
                  const letter = optionLetters[optIdx];
                  const isSelected = selectedAnswers[currentIndex] === letter;

                  let optionStyle = "neu-btn text-slate-700 hover:text-indigo-600";
                  if (isSelected) {
                    optionStyle = "neu-inset text-indigo-700 font-bold border-2 border-indigo-400 bg-indigo-50/60 shadow-inner";
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(letter)}
                      className={`w-full p-3.5 rounded-xl text-left flex items-start gap-3 transition-all cursor-pointer ${optionStyle}`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                        isSelected ? "bg-indigo-600 text-white" : "neu-inset text-slate-700"
                      }`}>
                        {letter}
                      </span>
                      <span className="text-xs leading-relaxed font-semibold flex-1 pt-0.5">
                        {optText}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Prev, Next, Submit */}
              <div className="flex items-center justify-between pt-3 border-t border-white/80">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <span>Next Question</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishQuiz}
                    disabled={isSubmitting}
                    className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ml-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 size={15} />
                    <span>{isSubmitting ? "Submitting..." : "Submit Quiz"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & RESULTS WITH ANSWERS & EXPLANATIONS */}
          {step === "summary" && (
            <div className="space-y-6 py-2 animate-fadeIn">
              {/* Header Trophy & Score */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl neu-inset mx-auto flex items-center justify-center text-amber-500">
                  <Trophy size={32} />
                </div>

                <h3 className="text-xl font-black text-slate-800">Practice Completed!</h3>
                <p className="text-xs text-slate-500">
                  Review your answers and detailed explanations below.
                </p>
              </div>

              {/* Score Card */}
              {(() => {
                const score = calculateScore();
                return (
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <div className="neu-card-sm p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Correct</span>
                      <p className="text-base font-black text-emerald-600 mt-1">{score.correct}</p>
                    </div>
                    <div className="neu-card-sm p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                      <p className="text-base font-black text-slate-700 mt-1">{score.total}</p>
                    </div>
                    <div className="neu-card-sm p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</span>
                      <p className="text-base font-black text-indigo-600 mt-1">{score.percentage}%</p>
                    </div>
                  </div>
                );
              })()}

              {/* Mastery Boost Feedback */}
              {masteryResult && (
                <div className="neu-card-sm p-4 border-emerald-200/80 bg-emerald-50/40 text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                    <Sparkles size={16} className="text-emerald-600" />
                    <span>Topic Mastery Updated</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Your practice effort has updated your mastery for <strong>{masteryResult.topicName}</strong> to{" "}
                    <strong>{masteryResult.scorePercentage}%</strong> ({masteryResult.level}).
                  </p>
                </div>
              )}

              {/* DETAILED QUESTION-BY-QUESTION REVIEW WITH ANSWERS AND EXPLANATIONS */}
              <div className="space-y-4 text-left pt-2">
                <div className="flex items-center justify-between border-b border-white/80 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Question-by-Question Review &amp; Explanations
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">
                    {questions.length} Questions Reviewed
                  </span>
                </div>

                {questions.map((q, idx) => {
                  const studentAns = selectedAnswers[idx];
                  const isCorrect = studentAns === q.correctOption;

                  return (
                    <div
                      key={idx}
                      className={`neu-card p-4 space-y-3 rounded-2xl border transition-all ${
                        isCorrect
                          ? "border-emerald-200/80 bg-emerald-50/15"
                          : "border-rose-200/80 bg-rose-50/15"
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                            {idx + 1}
                          </span>
                          {q.topic && (
                            <span className="neu-pill px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 flex items-center gap-1">
                              <BookOpen size={10} />
                              <span>{q.topic}</span>
                            </span>
                          )}
                        </div>

                        <span
                          className={`neu-pill px-2.5 py-0.5 text-[10px] font-black flex items-center gap-1 ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 size={12} className="text-emerald-700" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} className="text-rose-700" />
                              <span>Incorrect</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Question Text */}
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">
                        {q.text}
                      </p>

                      {/* Options Review */}
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const letter = optionLetters[optIdx];
                          const isStudentPick = studentAns === letter;
                          const isRightAnswer = q.correctOption === letter;

                          let badgeStyle = "text-slate-600 bg-white/40 border border-white/80";
                          if (isRightAnswer) {
                            badgeStyle = "bg-emerald-100/90 border border-emerald-300 text-emerald-900 font-bold shadow-xs";
                          } else if (isStudentPick && !isRightAnswer) {
                            badgeStyle = "bg-rose-100/90 border border-rose-300 text-rose-900 font-bold shadow-xs";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2.5 ${badgeStyle}`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  isRightAnswer ? "bg-emerald-600 text-white" : isStudentPick ? "bg-rose-600 text-white" : "neu-inset text-slate-600"
                                }`}>
                                  {letter}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1">
                                {isRightAnswer && (
                                  <span className="neu-pill px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800 bg-emerald-50">
                                    Correct Answer
                                  </span>
                                )}
                                {isStudentPick && !isRightAnswer && (
                                  <span className="neu-pill px-2 py-0.5 text-[9px] font-black uppercase text-rose-800 bg-rose-50">
                                    Your Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pedagogical Explanation Box */}
                      <div className="neu-inset p-3 rounded-xl bg-white/60 space-y-1 text-slate-700 text-xs mt-2 border border-white/80">
                        <div className="flex items-center gap-1.5 font-black text-indigo-700 text-[11px]">
                          <HelpCircle size={13} />
                          <span>Detailed Explanation</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600 font-medium pl-4">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => {
                    setStep("configure");
                    setQuestions([]);
                    setSelectedAnswers({});
                    setMasteryResult(null);
                  }}
                  className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Practise Again</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="neu-btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
