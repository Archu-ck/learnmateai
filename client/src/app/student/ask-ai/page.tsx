"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import AiDoubtChat from "@/components/AiDoubtChat";
import { SkeletonWorkspace } from "@/components/Skeleton";
import {
  Bot,
  Sparkles,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

interface SubjectSummary {
  id: string;
  name: string;
  code: string;
  isElective: boolean;
  teacherName: string;
}

export default function StudentAskAIPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("question") || "";
  const initialSubId = searchParams.get("subjectId") || "";

  const [subjects, setSubjects] = useState<SubjectSummary[]>(() => {
    return api.getCached<{ subjects: SubjectSummary[] }>("/api/student/subjects")?.subjects || [];
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    const cached = api.getCached<{ subjects: SubjectSummary[] }>("/api/student/subjects")?.subjects || [];
    if (cached.length > 0) {
      const matched = initialSubId ? cached.find((s) => s.id === initialSubId) : null;
      return matched ? matched.id : cached[0].id;
    }
    return "";
  });

  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(() => {
    return subjects.length === 0;
  });

  // Load all enrolled subjects for the student
  useEffect(() => {
    const hasCached = subjects.length > 0;
    async function loadSubjects() {
      try {
        if (!hasCached) setLoadingSubjects(true);
        const res = await api.get<{ subjects: SubjectSummary[] }>("/api/student/subjects");
        const subs = res.subjects || [];
        setSubjects(subs);

        if (subs.length > 0 && !selectedSubjectId) {
          const matched = initialSubId ? subs.find((s) => s.id === initialSubId) : null;
          const chosen = matched ? matched.id : subs[0].id;
          setSelectedSubjectId(chosen);
        }
      } catch (err: any) {
        if (!hasCached) toast(err.message || "Failed to load subjects", "error");
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, [initialSubId]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="h-full flex flex-col w-full font-sans min-h-0 overflow-hidden">
      {/* Top Header Card */}
      <div className="neu-card px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800">
                Ask AI Academic Tutor
              </h1>
              <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-600" />
                <span>Class 10 Explanatory Tutor</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ask doubts in any study topic to receive step-by-step explanations, conceptual insights, and guided hints.
            </p>
          </div>
        </div>

        {/* Subject Switcher Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-slim py-0.5">
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                    : "neu-btn text-slate-700 hover:text-slate-900"
                }`}
              >
                <BookOpen size={13} className={isSelected ? "text-white" : "text-indigo-500"} />
                <span>{sub.name}</span>
                {sub.code && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected ? "bg-white/20 text-white" : "bg-white/70 text-slate-500"
                    }`}
                  >
                    {sub.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Single-Page AI Doubt Chat Container */}
      {loadingSubjects ? (
        <SkeletonWorkspace />
      ) : activeSubject ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <AiDoubtChat
            key={activeSubject.id}
            subjectId={activeSubject.id}
            subjectName={activeSubject.name}
            initialQuestion={initialQuery}
            containerClassName="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 h-full w-full overflow-hidden"
          />
        </div>
      ) : (
        <div className="neu-card flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300" />
          <h3 className="text-sm font-extrabold text-slate-700">No Subjects Enrolled</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Please check your enrollment status or contact your school administrator.
          </p>
        </div>
      )}
    </div>
  );
}
