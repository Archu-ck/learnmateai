"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Bot,
  Layers,
  X,
} from "lucide-react";

interface StudyBlockItem {
  _id?: string;
  day: string;
  startTime: string;
  endTime: string;
  title: string;
  subjectName: string;
  type: "study" | "school" | "free";
  isCompleted?: boolean;
}

export default function StudentStudyPlannerPage() {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<StudyBlockItem[]>(() => {
    const cached = api.getCached<{ blocks: StudyBlockItem[] }>("/api/student/planner");
    return cached?.blocks || [];
  });
  const [loading, setLoading] = useState<boolean>(() => !api.getCached("/api/student/planner"));

  // New Block Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    day: "Monday",
    startTime: "17:00",
    endTime: "18:00",
    title: "",
    subjectName: "Mathematics",
    type: "study",
  });

  // AI Plan Generation State
  const [aiGenerating, setAiGenerating] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const loadPlanner = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get<{ blocks: StudyBlockItem[] }>("/api/student/planner");
      setBlocks(res.blocks || []);
    } catch (err: any) {
      if (!silent) toast(err.message || "Failed to load study planner", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCached = !!api.getCached("/api/student/planner");
    loadPlanner(hasCached);
  }, []);

  // Add block
  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ block: StudyBlockItem }>(
        "/api/student/planner/block",
        newBlock
      );
      setBlocks((prev) => [...prev, res.block]);
      toast("Study block added", "success");
      setShowAddModal(false);
      setNewBlock({ ...newBlock, title: "" });
    } catch (err: any) {
      toast(err.message || "Failed to add block", "error");
    }
  };

  // Toggle complete
  const handleToggleComplete = async (block: StudyBlockItem) => {
    const newStatus = !block.isCompleted;
    try {
      await api.post("/api/student/planner/block", {
        id: block._id,
        isCompleted: newStatus,
      });
      setBlocks((prev) =>
        prev.map((b) => (b._id === block._id ? { ...b, isCompleted: newStatus } : b))
      );
    } catch (err: any) {
      toast(err.message || "Failed to update block", "error");
    }
  };

  // Delete block
  const handleDeleteBlock = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/api/student/planner/block/${id}`);
      setBlocks((prev) => prev.filter((b) => b._id !== id));
      toast("Block removed", "success");
    } catch (err: any) {
      toast(err.message || "Failed to delete block", "error");
    }
  };

  // AI Generate Study Plan Handler (Calls /api/ai/generate-study-plan)
  const handleGenerateAIPlan = async () => {
    try {
      setAiGenerating(true);
      const res = await api.post("/api/ai/generate-study-plan", {
        targetExam: "Grade 8 Term Evaluations",
        dailyHours: 2.5,
      });

      // Populate returned AI blocks into local planner & DB
      for (const b of res.blocks || []) {
        await api.post("/api/student/planner/block", b);
      }
      toast("AI study plan generated and loaded!", "success");
      loadPlanner();
    } catch (err: any) {
      toast(err.message || "Failed to generate AI plan", "error");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="neu-card p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Interactive Study Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Organize revision blocks, track daily study routines, and balance academic workload.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateAIPlan}
            disabled={aiGenerating}
            className="neu-btn px-4 py-2.5 text-indigo-600 text-xs font-bold flex items-center gap-2 hover:text-indigo-700"
          >
            <Bot size={15} />
            <span>{aiGenerating ? "Generating Plan (800ms)..." : "Generate Plan with AI"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="neu-btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl"
          >
            <Plus size={15} />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {days.map((day) => {
          const dayBlocks = blocks.filter((b) => b.day === day);
          return (
            <div
              key={day}
              className="neu-card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/80">
                  <h2 className="text-sm font-extrabold text-slate-800">{day}</h2>
                  <span className="neu-pill text-[10px] font-extrabold px-2.5 py-0.5 bg-white/70 text-slate-600">
                    {dayBlocks.length} Blocks
                  </span>
                </div>

                <div className="space-y-3">
                  {dayBlocks.map((b, idx) => (
                    <div
                      key={b._id || idx}
                      className={`p-3.5 rounded-xl border transition-all text-xs flex items-start justify-between gap-2 ${
                        b.isCompleted
                          ? "neu-inset opacity-60 line-through"
                          : "neu-card-sm"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(b)}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 cursor-pointer ${
                              b.isCompleted
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 bg-white/80"
                            }`}
                          >
                            {b.isCompleted && <CheckCircle2 size={12} />}
                          </button>
                          <span className="font-bold text-slate-800 truncate">
                            {b.title || b.subjectName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-6 font-medium">
                          {b.startTime} - {b.endTime} • {b.subjectName}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(b._id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {dayBlocks.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-6 text-center font-medium">
                      Free time / No study blocks.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Block */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Study Block</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Day of Week
                </label>
                <select
                  value={newBlock.day}
                  onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Title / Goal
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Practice Factoring Equations"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                >
                  Add Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
