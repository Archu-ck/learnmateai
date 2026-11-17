"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  X,
  Plus,
  Trash2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Check,
  BookOpen,
  Layers,
  Clock,
  Calendar,
  CheckSquare,
  Bookmark,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface TopicOption {
  id: string;
  name: string;
}

interface MCQQuestion {
  text: string;
  options: string[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
}

export default function AiTestBuilderModal({
  classId,
  className,
  subjectId,
  subjectName,
  topics = [],
  sections = ["A"],
  onClose,
  onTestPublished,
}: {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  topics: TopicOption[];
  sections?: string[];
  onClose: () => void;
  onTestPublished: () => void;
}) {
  const { toast } = useToast();

  // Wizard Step: 'config' | 'review' | 'publish'
  const [step, setStep] = useState<"config" | "review" | "publish">("config");

  // Configuration Form State
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    topics.slice(0, 3).map((t) => t.id)
  );
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("medium");
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(2);
  const [extraInstructions, setExtraInstructions] = useState<string>("");
  const [sourceText, setSourceText] = useState<string>("");

  // Review State
  const [draftId, setDraftId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Publish Settings State
  const [testSettings, setTestSettings] = useState({
    title: `${subjectName} Assessment — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    durationMinutes: 30,
    startWindow: new Date().toISOString().split("T")[0],
    endWindow: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    selectedSections: sections,
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // Toggle topic selection
  const handleToggleTopic = (tId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
    );
  };

  // Step 1: Generate Questions
  const handleGenerateQuestions = async () => {
    if (topics.length > 0 && selectedTopicIds.length === 0) {
      toast("Please select at least one chapter from the subject.", "error");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await api.post<any>("/api/teacher/tests/generate-ai", {
        subjectId,
        classId,
        topicIds: selectedTopicIds,
        questionCount,
        difficulty,
        marksPerQuestion,
        extraInstructions,
        sourceText,
      });

      setDraftId(res.draftId);
      setQuestions(res.questions || []);
      setStep("review");
      toast(`AI generated ${res.questions?.length || 0} questions for review!`, "success");
    } catch (err: any) {
      toast(err.message || "Failed to generate questions with AI", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Regenerate Single Question
  const handleRegenerateQuestion = async (index: number) => {
    if (!draftId) return;
    try {
      setRegeneratingIndex(index);
      const res = await api.post<any>("/api/teacher/tests/regenerate-question", {
        draftId,
        questionIndex: index,
        topic: questions[index]?.topic,
        difficulty: questions[index]?.difficulty || "medium",
        extraInstructions,
      });

      if (res.updatedQuestion) {
        setQuestions((prev) =>
          prev.map((q, idx) => (idx === index ? res.updatedQuestion : q))
        );
        toast(`Regenerated question #${index + 1}!`, "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to regenerate question", "error");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Delete Question
  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
    toast(`Removed question #${index + 1}`, "info");
  };

  // Reorder Questions
  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Add Manual Question
  const handleAddManualQuestion = () => {
    const newQ: MCQQuestion = {
      text: "Enter your question text here...",
      options: ["Option A text", "Option B text", "Option C text", "Option D text"],
      correctOption: "A",
      explanation: "Add explanation for why option A is correct and common mistakes.",
      difficulty: "medium",
      marks: marksPerQuestion,
      topic: topics[0]?.name || "General",
    };
    setQuestions((prev) => [...prev, newQ]);
    toast("Added new question card to review list", "success");
  };

  // Update question field
  const handleUpdateQuestion = (index: number, updates: Partial<MCQQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, ...updates } : q))
    );
  };

  // Update question option text
  const handleUpdateOption = (qIndex: number, optIndex: number, newText: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = newText;
        return { ...q, options: newOpts };
      })
    );
  };

  // Save to Question Bank
  const handleSaveToBank = async () => {
    if (!draftId) return;
    try {
      setIsSavingBank(true);
      // Sync edits to draft first
      await api.post("/api/teacher/tests/save-draft", { draftId, questions });
      const res = await api.post<any>("/api/teacher/tests/save-to-bank", { draftId });
      toast(res.message || "Saved to question bank!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to save to bank", "error");
    } finally {
      setIsSavingBank(false);
    }
  };

  // Step 3: Publish to Students
  const handlePublishTest = async () => {
    if (!draftId) return;
    try {
      setIsPublishing(true);
      // Sync edits first
      await api.post("/api/teacher/tests/save-draft", { draftId, questions });

      const res = await api.post<any>("/api/teacher/tests/publish-ai-test", {
        draftId,
        title: testSettings.title,
        durationMinutes: testSettings.durationMinutes,
        startWindow: testSettings.startWindow,
        endWindow: testSettings.endWindow,
        maxAttempts: testSettings.maxAttempts,
        shuffleQuestions: testSettings.shuffleQuestions,
        shuffleOptions: testSettings.shuffleOptions,
        sections: testSettings.selectedSections,
      });

      toast("Test published successfully to students!", "success");
      onTestPublished();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to publish test", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const totalCalculatedMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="neu-card max-w-4xl w-full p-6 sm:p-7 space-y-5 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/80 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="neu-circle w-9 h-9 text-indigo-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>AI Test Builder & Review</span>
                <span className="neu-pill text-[10px] font-black px-2 py-0.5 text-indigo-700 bg-indigo-50">
                  {step === "config" ? "Step 1: Configure" : step === "review" ? "Step 2: Review & Edit" : "Step 3: Publish Settings"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {className} • {subjectName} Curriculum
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ================= STEP 1: CONFIGURATION FORM ================= */}
        {step === "config" && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-slim">
            {/* Topic Multi-select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600" />
                  <span>Syllabus Chapters to Cover</span>
                  <span className="neu-pill px-2 py-0.5 text-[10px] font-black text-indigo-700 bg-indigo-50">
                    {selectedTopicIds.length} of {topics.length} selected
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTopicIds(topics.map((t) => t.id))}
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
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => {
                  const isChecked = selectedTopicIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleTopic(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? "neu-btn-primary text-white shadow-xs"
                          : "neu-btn text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {isChecked && <Check size={12} />}
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
              {selectedTopicIds.length === 0 && (
                <p className="text-[11px] font-semibold text-rose-500">
                  Please select at least one chapter from the subject.
                </p>
              )}
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Question Count (5 - 30)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                  className="neu-input w-full p-2.5 text-xs font-extrabold text-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="neu-input w-full p-2.5 text-xs font-bold text-slate-800 rounded-xl cursor-pointer"
                >
                  <option value="easy">Easy (Foundational)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="hard">Hard (Advanced / Challenge)</option>
                  <option value="mixed">Mixed Difficulty</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Marks Per Question
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(parseInt(e.target.value) || 1)}
                  className="neu-input w-full p-2.5 text-xs font-extrabold text-slate-800 rounded-xl"
                />
              </div>
            </div>

            {/* Extra Instructions */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teacher's Specific Instructions (Optional)
              </label>
              <input
                type="text"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. Focus on practical real-world word problems and step-by-step calculations"
                className="neu-input w-full p-2.5 text-xs font-medium rounded-xl"
              />
            </div>

            {/* Optional Source Text */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Source Text Material (Optional)
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste relevant textbook excerpts, lecture notes, or problem statements..."
                rows={3}
                className="neu-input w-full p-2.5 text-xs font-medium rounded-xl resize-none"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: REVIEW & EDIT QUESTIONS ================= */}
        {step === "review" && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-slim">
            {/* Top Toolbar in Review */}
            <div className="flex items-center justify-between pb-2 border-b border-white/80 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="neu-pill px-3 py-1 text-xs font-extrabold text-indigo-700 bg-indigo-50">
                  {questions.length} Questions
                </span>
                <span className="neu-pill px-3 py-1 text-xs font-extrabold text-emerald-800 bg-emerald-50">
                  Total: {totalCalculatedMarks} Marks
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="neu-btn px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
                  title="Re-run AI generation from scratch"
                >
                  <RotateCcw size={13} />
                  <span>Regenerate All</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="neu-btn px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Question</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToBank}
                  disabled={isSavingBank}
                  className="neu-btn px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5 hover:text-indigo-800 cursor-pointer"
                >
                  <Bookmark size={13} />
                  <span>{isSavingBank ? "Saving..." : "Save to Bank"}</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const optLetters = ["A", "B", "C", "D"] as const;
                const isRegenerating = regeneratingIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`neu-card p-4 sm:p-5 space-y-3 transition-all ${
                      isRegenerating ? "opacity-50 animate-pulse" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-white/80 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                        <span className="neu-pill text-[11px] font-black px-2.5 py-0.5 text-indigo-700 bg-indigo-50 flex items-center gap-1">
                          <BookOpen size={11} />
                          <span>Chapter: {q.topic || "General"}</span>
                        </span>
                        <span className="neu-pill text-[10px] font-bold px-2 py-0.5 capitalize text-slate-600 bg-white/70">
                          {q.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={q.marks || 1}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, { marks: parseInt(e.target.value) || 1 })
                          }
                          className="neu-input w-14 p-1 text-center text-xs font-bold"
                          title="Marks"
                        />
                        <span className="text-xs font-bold text-slate-400">pts</span>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, "up")}
                          disabled={idx === 0}
                          className="neu-circle w-7 h-7 text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, "down")}
                          disabled={idx === questions.length - 1}
                          className="neu-circle w-7 h-7 text-slate-500 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateQuestion(idx)}
                          disabled={isRegenerating}
                          className="neu-circle w-7 h-7 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          title="Regenerate this question with AI"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="neu-circle w-7 h-7 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <textarea
                        value={q.text}
                        onChange={(e) => handleUpdateQuestion(idx, { text: e.target.value })}
                        rows={2}
                        className="neu-input w-full p-2.5 text-xs font-bold text-slate-800 rounded-xl"
                      />
                    </div>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {optLetters.map((letter, optIdx) => {
                        const isCorrect = q.correctOption === letter;
                        return (
                          <div
                            key={letter}
                            onClick={() => handleUpdateQuestion(idx, { correctOption: letter })}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
                                : "neu-inset border-transparent hover:border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "neu-card text-slate-500"
                              }`}
                            >
                              {letter}
                            </span>
                            <input
                              type="text"
                              value={q.options[optIdx] || ""}
                              onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                              className="bg-transparent flex-1 font-semibold text-slate-800 focus:outline-none"
                            />
                            {isCorrect && (
                              <span className="text-[10px] font-black uppercase text-emerald-700">Correct</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="neu-inset p-3 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-black text-indigo-700 block tracking-wider">
                        Pedagogical Explanation:
                      </span>
                      <textarea
                        value={q.explanation}
                        onChange={(e) => handleUpdateQuestion(idx, { explanation: e.target.value })}
                        rows={2}
                        className="w-full bg-transparent text-[11px] font-medium text-slate-600 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 3: PUBLISH SETTINGS ================= */}
        {step === "publish" && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-slim">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Published Test Title
              </label>
              <input
                type="text"
                required
                value={testSettings.title}
                onChange={(e) => setTestSettings({ ...testSettings, title: e.target.value })}
                className="neu-input w-full p-2.5 text-xs font-bold text-slate-800 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={testSettings.durationMinutes}
                  onChange={(e) =>
                    setTestSettings({ ...testSettings, durationMinutes: parseInt(e.target.value) || 30 })
                  }
                  className="neu-input w-full p-2.5 text-xs font-bold text-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Start Window
                </label>
                <input
                  type="date"
                  value={testSettings.startWindow}
                  onChange={(e) => setTestSettings({ ...testSettings, startWindow: e.target.value })}
                  className="neu-input w-full p-2.5 text-xs font-bold text-slate-800 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  End Window
                </label>
                <input
                  type="date"
                  value={testSettings.endWindow}
                  onChange={(e) => setTestSettings({ ...testSettings, endWindow: e.target.value })}
                  className="neu-input w-full p-2.5 text-xs font-bold text-slate-800 rounded-xl"
                />
              </div>
            </div>

            {/* Test Security & Anti-Cheating Toggles */}
            <div className="neu-card p-4 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 block">Exam Security & Anti-Cheating</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testSettings.shuffleQuestions}
                    onChange={(e) =>
                      setTestSettings({ ...testSettings, shuffleQuestions: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Shuffle Questions per Student</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testSettings.shuffleOptions}
                    onChange={(e) =>
                      setTestSettings({ ...testSettings, shuffleOptions: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Shuffle Answer Options (A - D)</span>
                </label>
              </div>
            </div>

            {/* Target Sections */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Assign to Sections</label>
              <div className="flex gap-2">
                {sections.map((sec) => {
                  const isChecked = testSettings.selectedSections.includes(sec);
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        const newSecs = isChecked
                          ? testSettings.selectedSections.filter((s) => s !== sec)
                          : [...testSettings.selectedSections, sec];
                        setTestSettings({ ...testSettings, selectedSections: newSecs });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isChecked ? "neu-btn-primary text-white" : "neu-btn text-slate-600"
                      }`}
                    >
                      Section {sec}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Bar */}
        <div className="pt-3 border-t border-white/80 flex items-center justify-between shrink-0">
          <div>
            {step === "review" && (
              <button
                type="button"
                onClick={() => setStep("config")}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back to Config</span>
              </button>
            )}
            {step === "publish" && (
              <button
                type="button"
                onClick={() => setStep("review")}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back to Questions</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>

            {step === "config" && (
              <button
                type="button"
                disabled={isGenerating || selectedTopicIds.length === 0}
                onClick={handleGenerateQuestions}
                className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{isGenerating ? "Generating Assessment..." : "Generate with AI"}</span>
              </button>
            )}

            {step === "review" && (
              <button
                type="button"
                onClick={() => setStep("publish")}
                className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Publish</span>
                <ChevronRight size={14} />
              </button>
            )}

            {step === "publish" && (
              <button
                type="button"
                disabled={isPublishing || testSettings.selectedSections.length === 0}
                onClick={handlePublishTest}
                className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckSquare size={14} />
                <span>{isPublishing ? "Publishing Assessment..." : "Publish Test to Students"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
