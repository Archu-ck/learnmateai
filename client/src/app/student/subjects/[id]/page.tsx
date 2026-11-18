"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import AiDoubtChat from "@/components/AiDoubtChat";
import StudentPracticeQuizModal from "@/components/StudentPracticeQuizModal";
import NeumorphicSelect from "@/components/NeumorphicSelect";
import { getSocket } from "@/lib/socket";
import {
  BookOpen,
  Layers,
  FileText,
  CheckSquare,
  MessageSquare,
  Bot,
  TrendingUp,
  User,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface WorkspaceData {
  subject: { id: string; name: string; code: string; isElective: boolean };
  teacher: { id: string; name: string; email: string } | null;
  topics: Array<{ id: string; name: string; order: number; masteryLevel: string; scorePercentage: number }>;
  lessons: Array<{
    id: string;
    topicId: string;
    title: string;
    content: string;
    files: Array<{ name: string; url: string; size: number }>;
    links: Array<{ title: string; url: string }>;
    isRead: boolean;
    createdAt: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    totalMarks: number;
    estimatedMinutes: number;
    aiHelpLevel: string;
    status: string;
    submission: any;
  }>;
  tests: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    totalMarks: number;
    startWindow: string;
    endWindow: string;
    attempt: any;
  }>;
  grades: Array<{
    id: string;
    assessmentTitle: string;
    assessmentType: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    createdAt: string;
  }>;
}

interface EnrolledSubjectSummary {
  id: string;
  name: string;
  code: string;
}

export default function SubjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "assignments" | "tests" | "chat" | "ask-ai" | "grades"
  >("overview");

  useEffect(() => {
    if (searchParams?.get("askAI") === "true") {
      setActiveTab("ask-ai");
      if (searchParams?.get("question")) {
        setAiQuestion(searchParams.get("question") || "");
      }
    }
  }, [searchParams]);

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [allSubjects, setAllSubjects] = useState<EnrolledSubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Chat Tab State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDoubt, setIsDoubt] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Ask AI Doubt State
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDoubtHistory, setAiDoubtHistory] = useState<
    Array<{ question: string; answer: string; steps: string[]; timestamp: string }>
  >([]);

  // Practice Quiz State
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState<{ id?: string; name: string } | null>(null);

  // Fetch Workspace Data & All Enrolled Subjects for easy switching
  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const [res, subjectsRes] = await Promise.all([
        api.get<WorkspaceData>(`/api/student/subjects/${subjectId}`),
        api.get<{ subjects: EnrolledSubjectSummary[] }>("/api/student/subjects").catch(() => ({ subjects: [] })),
      ]);
      setData(res);
      setAllSubjects(subjectsRes.subjects || []);
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes("403") || err.message?.includes("not enrolled")) {
        setForbidden(true);
      } else {
        toast(err.message || "Failed to load subject workspace", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [subjectId]);

  // Load chat messages when chat tab is opened
  useEffect(() => {
    if (activeTab === "chat" && subjectId) {
      loadChatThread();
    }
  }, [activeTab, subjectId]);

  useEffect(() => {
    if (activeTab !== "chat" || !threadId) return;

    const socket = getSocket();
    socket.emit("join_thread", { threadId });

    socket.on("new_message", (msg: any) => {
      if (msg.threadId === threadId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    socket.on("doubt_resolved", ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, resolved: true } : m))
      );
    });

    // 5-second polling fallback
    const interval = setInterval(async () => {
      try {
        const res = await api.get<{ thread: any; messages: any[] }>(
          `/api/chat/thread?threadId=${threadId}`
        );
        if (res.messages) {
          setMessages(res.messages);
        }
      } catch (e) {
        // Polling error non-fatal
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.emit("leave_thread", { threadId });
      socket.off("new_message");
      socket.off("doubt_resolved");
    };
  }, [activeTab, threadId]);

  const loadChatThread = async () => {
    try {
      const res = await api.get<{ thread: any; messages: any[] }>(
        `/api/chat/thread?subjectId=${subjectId}`
      );
      if (res.thread) setThreadId(res.thread._id);
      setMessages(res.messages || []);
    } catch (err) {
      // Chat might be initializing
    }
  };

  // Mark lesson as read
  const handleMarkRead = async (lessonId: string) => {
    try {
      await api.post(`/api/student/lessons/${lessonId}/read`);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lessons: prev.lessons.map((l) =>
            l.id === lessonId ? { ...l, isRead: true } : l
          ),
        };
      });
      toast("Lesson marked as completed!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to mark lesson as read", "error");
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSendingMsg(true);
      const res = await api.post<any>("/api/chat/message", {
        threadId,
        subjectId,
        text: newMessage.trim(),
        isDoubt,
      });

      if (res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
      }
      setNewMessage("");
      setIsDoubt(false);
      toast(isDoubt ? "Doubt sent to teacher!" : "Message sent!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to send message", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  // Ask AI Doubt (Calls /api/ai/ask-doubt)
  const handleAskAI = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const query = customQ || aiQuestion;
    if (!query.trim()) return;

    try {
      setAiLoading(true);
      const res = await api.post<any>("/api/ai/ask-doubt", {
        question: query,
        subjectName: data?.subject.name || "Mathematics",
      });

      setAiDoubtHistory((prev) => [
        {
          question: query,
          answer: res.answer,
          steps: res.steps || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);
      if (!customQ) setAiQuestion("");
    } catch (err: any) {
      toast(err.message || "Failed to consult AI tutor", "error");
    } finally {
      setAiLoading(false);
    }
  };

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 neu-card text-center space-y-4 font-sans">
        <div className="neu-circle w-14 h-14 mx-auto text-rose-500">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Access Denied (403)</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
          You are not enrolled in this subject. Under school security policies, students can only access subjects assigned to them.
        </p>
        <Link
          href="/student/subjects"
          className="neu-btn px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 inline-flex items-center gap-2 hover:text-indigo-600"
        >
          <ChevronLeft size={14} />
          <span>Return to My Subjects</span>
        </Link>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 w-full pb-16 font-sans">
        <div className="h-28 neu-card animate-pulse rounded-3xl" />
        <div className="h-96 neu-card animate-pulse rounded-3xl" />
      </div>
    );
  }

  const { subject, teacher, topics, lessons, assignments, tests, grades } = data;

  const tabs = [
    { key: "overview", label: "Syllabus Topics", count: topics.length, icon: Layers },
    { key: "lessons", label: "Lessons & Notes", count: lessons.length, icon: BookOpen },
    { key: "assignments", label: "Assignments", count: assignments.length, icon: FileText },
    { key: "tests", label: "Tests & Quizzes", count: tests.length, icon: CheckSquare },
    { key: "ask-ai", label: "Ask AI Tutor", count: null, icon: Bot },
    { key: "chat", label: "Teacher Chat", count: null, icon: MessageSquare },
    { key: "grades", label: "Grades & Trends", count: grades.length, icon: TrendingUp },
  ];

  const pendingAssignmentsCount = assignments.filter((a) => a.status !== "graded" && a.status !== "submitted").length;
  const avgMastery = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + (t.scorePercentage || 0), 0) / topics.length)
    : 80;

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* Top Navigation Bar: Breadcrumbs & Quick Subject Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/student/subjects"
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 hover:text-indigo-600"
          >
            <ChevronLeft size={15} />
            <span>All Subjects</span>
          </Link>
          <span className="text-slate-400 font-bold text-xs">/</span>
          <span className="text-xs font-extrabold text-slate-800">{subject.name}</span>
        </div>

        {/* Quick Subject Switcher Dropdown */}
        {allSubjects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Switch Subject:
            </span>
            <NeumorphicSelect
              value={subjectId}
              onChange={(newId) => router.push(`/student/subjects/${newId}`)}
              options={allSubjects.map((s) => ({
                value: s.id,
                label: s.name,
                badge: s.code,
              }))}
              icon={<BookOpen size={13} />}
              minWidth="min-w-[210px]"
            />
          </div>
        )}
      </div>

      {/* Main Workspace Header Card */}
      <div className="neu-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="neu-pill px-2.5 py-0.5 text-xs font-mono font-black text-indigo-700 bg-indigo-50/80">
                {subject.code}
              </span>
              <span
                className={`neu-pill text-[10px] font-black px-2.5 py-0.5 ${
                  subject.isElective
                    ? "bg-amber-100/80 text-amber-800"
                    : "bg-emerald-100/80 text-emerald-800"
                }`}
              >
                {subject.isElective ? "Elective Course" : "Compulsory Core"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
              {subject.name} Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <User size={14} className="text-indigo-500" />
              <span>Instructor:</span>
              <strong className="text-slate-800 font-bold">{teacher?.name || "Unassigned"}</strong>
              {teacher?.email && <span className="text-slate-400">({teacher.email})</span>}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab("ask-ai")}
              className="neu-btn px-4 py-2.5 text-indigo-600 text-xs font-bold flex items-center gap-2 hover:text-indigo-700"
            >
              <Bot size={15} />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className="neu-btn-primary px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <MessageSquare size={15} />
              <span>Message Teacher</span>
            </button>
          </div>
        </div>

        {/* Quick Snapshot Metrics Strip */}
        <div className="neu-inset p-3.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Syllabus Topics</span>
            <span className="text-sm font-black text-slate-800">{topics.length} Configured</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Overall Mastery</span>
            <span className="text-sm font-black text-indigo-700">{avgMastery}%</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Pending Work</span>
            <span className={`text-sm font-black ${pendingAssignmentsCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {pendingAssignmentsCount > 0 ? `${pendingAssignmentsCount} Due` : "All Done"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tests Available</span>
            <span className="text-sm font-black text-slate-800">{tests.length} Listed</span>
          </div>
        </div>
      </div>

      {/* Structured Segmented Navigation (Fully Reactive, Auto-Fills Rows on Any Screen Size) */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 min-w-[110px] sm:min-w-[130px] p-2.5 sm:p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                  : "neu-btn text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={15} className={isActive ? "text-white" : "text-indigo-600"} />
                {tab.count !== null && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-center leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & SYLLABUS TOPICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="neu-card p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">
                  Syllabus Topics &amp; Mastery Levels
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Your comprehension based on completed quizzes, assignments, and revision sessions.
                </p>
              </div>
              <span className="neu-pill px-3 py-1 text-xs font-extrabold text-indigo-700 bg-indigo-50">
                {topics.length} Chapters
              </span>
            </div>

            <div className="space-y-3">
              {topics.map((top) => (
                <div
                  key={top.id}
                  className="neu-card-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
                      Topic {top.order + 1}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 truncate mt-0.5">
                      {top.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-72">
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] mb-1 font-bold">
                        <span className="capitalize text-slate-600">{top.masteryLevel}</span>
                        <span className="text-indigo-600 font-black">{top.scorePercentage}%</span>
                      </div>
                      <div className="w-full h-2 neu-inset rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                            top.scorePercentage >= 80
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : top.scorePercentage >= 65
                              ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                              : "bg-gradient-to-r from-amber-500 to-rose-500"
                          }`}
                          style={{ width: `${top.scorePercentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("ask-ai");
                        setAiQuestion(`Can you explain the key concepts and formulas of "${top.name}"?`);
                      }}
                      className="neu-btn px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 whitespace-nowrap flex items-center gap-1"
                    >
                      <Bot size={12} />
                      <span>Practise</span>
                    </button>
                  </div>
                </div>
              ))}
              {topics.length === 0 && (
                <p className="text-xs text-slate-400 italic py-6 text-center font-medium">
                  No syllabus topics configured yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LESSONS & NOTES */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="neu-card p-6 flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800">{lesson.title}</h3>
                  {lesson.isRead ? (
                    <span className="neu-pill inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5">
                      <CheckCircle2 size={13} /> Read
                    </span>
                  ) : (
                    <span className="neu-pill text-[11px] font-bold text-amber-700 bg-amber-50/80 px-2.5 py-0.5">
                      Unread
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                  {lesson.content}
                </p>

                {/* Attachments & Files */}
                {lesson.files?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {lesson.files.map((f, idx) => (
                      <a
                        key={idx}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        <Download size={13} className="text-indigo-500" />
                        <span>{f.name}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Reference Links */}
                {lesson.links?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {lesson.links.map((lnk, idx) => (
                      <a
                        key={idx}
                        href={lnk.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold"
                      >
                        <ExternalLink size={13} />
                        <span>{lnk.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {!lesson.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(lesson.id)}
                  className="neu-btn px-3.5 py-1.5 text-slate-800 hover:text-indigo-600 text-xs font-bold whitespace-nowrap self-start"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
              No lesson materials posted by the teacher yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          {assignments.map((ass) => (
            <div
              key={ass.id}
              className="neu-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-800">{ass.title}</h3>
                  <span className="neu-pill text-[10px] font-bold px-2 py-0.5 text-slate-600 bg-white/70">
                    AI Help: {ass.aiHelpLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 font-medium">{ass.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold pt-1">
                  <span>Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Marks: {ass.totalMarks}</span>
                  <span>•</span>
                  <span>Est. {ass.estimatedMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`neu-pill text-xs font-bold px-3 py-1 capitalize ${
                    ass.status === "graded"
                      ? "bg-emerald-50 text-emerald-800"
                      : ass.status === "submitted"
                      ? "bg-indigo-50 text-indigo-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {ass.status}
                </span>

                <Link
                  href={`/student/assignments/${ass.id}`}
                  className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  Open Assignment
                </Link>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
              No assignments assigned for this subject yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TESTS */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          {/* AI Practice Quiz Banner */}
          <div className="neu-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-indigo-100/60 bg-indigo-50/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-indigo-600">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Adaptive AI Practice Quiz</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Solidify your grasp with 5-10 private questions tailored to your grade level before tests.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPracticeTopic({
                  id: topics[0]?.id,
                  name: topics[0]?.name || "General Syllabus",
                });
                setPracticeModalOpen(true);
              }}
              className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
            >
              <Bot size={15} />
              <span>Practise with AI</span>
            </button>
          </div>

          {tests.map((t) => (
            <div
              key={t.id}
              className="neu-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-800">{t.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
                  <span>Duration: {t.durationMinutes} mins</span>
                  <span>•</span>
                  <span>Total Marks: {t.totalMarks}</span>
                  <span>•</span>
                  <span>Window: {new Date(t.startWindow).toLocaleDateString()} - {new Date(t.endWindow).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                {t.attempt?.status === "submitted" ? (
                  <Link
                    href={`/student/tests/${t.id}/results`}
                    className="neu-btn px-4 py-2 text-slate-800 text-xs font-bold inline-block hover:text-indigo-600"
                  >
                    View Results ({t.attempt.score} / {t.totalMarks})
                  </Link>
                ) : (
                  <Link
                    href={`/student/tests/${t.id}/take`}
                    className="neu-btn-primary px-5 py-2 text-white text-xs font-bold inline-block rounded-xl"
                  >
                    Start Test
                  </Link>
                )}
              </div>
            </div>
          ))}
          {tests.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
              No tests scheduled for this subject currently.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TEACHER CHAT */}
      {activeTab === "chat" && (
        <div className="neu-card overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-white/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                1-on-1 Chat with {teacher?.name || "Subject Teacher"}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Direct doubt resolution. Toggle the Doubt flag to alert the teacher.
              </p>
            </div>
            <span className="neu-pill text-[11px] font-bold px-2.5 py-0.5 text-slate-600">
              Active Hours (07:00 - 21:00)
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 neu-inset m-4 rounded-2xl">
            {messages.map((m, idx) => {
              const isMe = m.senderRole === "student";
              const isTeacher = m.senderRole === "teacher";

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isTeacher ? (
                      <span className="neu-pill text-[9px] font-black px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1">
                        <span>Teacher Reply</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        You
                      </span>
                    )}

                    {isTeacher && (
                      <span className="text-[11px] font-black text-slate-800">
                        {teacher?.name || "Subject Faculty"}
                      </span>
                    )}

                    {m.isDoubt && (
                      <span className="neu-pill text-[9px] font-black px-1.5 py-0.5 text-amber-800 bg-amber-50">
                        Doubt
                      </span>
                    )}
                    {m.resolved && (
                      <span className="neu-pill text-[9px] font-black px-1.5 py-0.5 text-emerald-800 bg-emerald-50">
                        Resolved
                      </span>
                    )}
                  </div>
                  <div
                    className={`max-w-lg px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                      isTeacher
                        ? "neu-card border-2 border-indigo-400/60 bg-indigo-50/70 text-slate-900 shadow-md rounded-tl-none"
                        : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 rounded-tr-none"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-medium">
                    {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-xs py-12 font-medium">
                No messages yet. Send a message or ask a doubt to your subject teacher below.
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/80 bg-transparent space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="neu-pill flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50/80 px-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDoubt}
                  onChange={(e) => setIsDoubt(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Tag as Academic Doubt</span>
              </label>

              <button
                type="button"
                onClick={() => setActiveTab("ask-ai")}
                className="neu-btn px-3 py-1 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-1.5 hover:text-indigo-900"
              >
                <Bot size={13} />
                <span>Want to ask AI first?</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to the teacher..."
                className="neu-input flex-1"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="neu-btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl disabled:opacity-50"
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: ASK AI (Full Streaming Doubt Tutor & Discussion Threads) */}
      {activeTab === "ask-ai" && (
        <AiDoubtChat
          subjectId={subjectId}
          subjectName={subject.name}
          topics={topics}
          initialQuestion={aiQuestion}
        />
      )}

      {/* TAB 7: GRADES & TRENDS */}
      {activeTab === "grades" && (
        <div className="neu-card p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {subject.name} Assessment Grades
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Published scores across assignments, quizzes, and tests for this subject.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Marks Obtained</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {grades.map((g, idx) => (
                  <tr key={idx} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {g.assessmentTitle}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-black text-slate-400">
                      {g.assessmentType}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-800">
                      {g.marksObtained}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold">{g.totalMarks}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`neu-pill text-xs font-black px-2.5 py-0.5 ${
                          g.percentage >= 80
                            ? "bg-emerald-50 text-emerald-800"
                            : g.percentage >= 60
                            ? "bg-indigo-50 text-indigo-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {g.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-medium">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {grades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No grades published for this subject yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Practice Quiz Modal */}
      {subject && (
        <StudentPracticeQuizModal
          isOpen={practiceModalOpen}
          onClose={() => setPracticeModalOpen(false)}
          subjectId={subject.id}
          subjectName={subject.name}
          topicId={selectedPracticeTopic?.id}
          topicName={selectedPracticeTopic?.name || "General Syllabus"}
          topics={topics.map((t) => ({ id: t.id, name: t.name }))}
          onMasteryUpdated={(newMastery) => {
            toast(`Mastery updated for ${newMastery.topicName}!`, "success");
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                topics: prev.topics.map((t) =>
                  t.name === newMastery.topicName
                    ? { ...t, scorePercentage: newMastery.scorePercentage, masteryLevel: newMastery.level }
                    : t
                ),
              };
            });
          }}
        />
      )}
    </div>
  );
}
