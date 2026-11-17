"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { getSocket } from "@/lib/socket";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  BookOpen,
  User,
  Sparkles,
} from "lucide-react";

interface ChatThreadItem {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  teacherId: { _id: string; name: string; email: string };
  subjectId: { _id: string; name: string; code: string };
  classId: { _id: string; name: string };
  section: string;
  lastMessageText: string;
  unreadStudentCount: number;
  hasUnresolvedDoubts: boolean;
  updatedAt: string;
}

export default function StudentChatInboxPage() {
  const { toast } = useToast();

  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThreadItem | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "doubts" | "unread">("all");

  // Message Form
  const [messageText, setMessageText] = useState("");
  const [isDoubt, setIsDoubt] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Chat Hours Status
  const [chatSettings, setChatSettings] = useState<{ isOpen: boolean; setting: any } | null>(null);

  // Load All Student Threads
  const loadThreads = async () => {
    try {
      setLoadingThreads(true);
      const [threadsRes, settingsRes] = await Promise.all([
        api.get<{ threads: ChatThreadItem[] }>("/api/chat/threads"),
        api.get<{ isOpen: boolean; setting: any }>("/api/chat/settings"),
      ]);
      setThreads(threadsRes.threads || []);
      setChatSettings(settingsRes);

      if (threadsRes.threads?.length > 0 && !activeThreadId) {
        setActiveThreadId(threadsRes.threads[0]._id);
        setActiveThread(threadsRes.threads[0]);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load chat inbox", "error");
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  // Load Messages for Active Thread
  const loadMessages = async (threadId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.get<{ thread: any; messages: any[] }>(
        `/api/chat/thread?threadId=${threadId}`
      );
      setMessages(res.messages || []);
      // Refresh thread unread counter
      setThreads((prev) =>
        prev.map((t) => (t._id === threadId ? { ...t, unreadStudentCount: 0 } : t))
      );
    } catch (err: any) {
      toast(err.message || "Failed to load thread messages", "error");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeThreadId) return;

    loadMessages(activeThreadId);

    // Socket real-time listener
    const socket = getSocket();
    socket.emit("join_thread", { threadId: activeThreadId });

    socket.on("new_message", (newMsg: any) => {
      if (newMsg.threadId === activeThreadId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    socket.on("doubt_resolved", ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, resolved: true } : m))
      );
    });

    // 5-second polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get<{ thread: any; messages: any[] }>(
          `/api/chat/thread?threadId=${activeThreadId}`
        );
        if (res.messages) {
          setMessages(res.messages);
        }
      } catch (e) {
        // Polling error non-fatal
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      socket.emit("leave_thread", { threadId: activeThreadId });
      socket.off("new_message");
      socket.off("doubt_resolved");
    };
  }, [activeThreadId]);

  // Send Message / Doubt
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeThreadId) return;

    try {
      setSendingMessage(true);
      const res = await api.post<any>("/api/chat/message", {
        threadId: activeThreadId,
        text: messageText.trim(),
        isDoubt,
      });
      setMessages((prev) => [...prev, res.message]);
      setMessageText("");
      setIsDoubt(false);
      toast(isDoubt ? "Doubt submitted to teacher" : "Message sent", "success");
    } catch (err: any) {
      toast(err.message || "Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const tName = t.teacherId?.name || "";
    const subName = t.subjectId?.name || "";
    const matchesSearch =
      tName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === "doubts") return t.hasUnresolvedDoubts;
    if (filterMode === "unread") return t.unreadStudentCount > 0;
    return true;
  });

  const totalDoubts = threads.filter((t) => t.hasUnresolvedDoubts).length;

  return (
    <div className="h-[calc(100vh-115px)] flex flex-col w-full pb-1 font-sans">
      {/* Top Header Bar */}
      <div className="neu-card px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
              <span>Student Chat &amp; Doubt Inbox</span>
              <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50">
                Subject Faculty
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Direct discussions with your assigned subject teachers. Teacher replies are officially highlighted.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {totalDoubts > 0 && (
            <span className="neu-pill text-xs font-black px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <HelpCircle size={13} />
              <span>{totalDoubts} Active Doubts</span>
            </span>
          )}

          {chatSettings && (
            <div
              className={`neu-pill px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${
                chatSettings.isOpen
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                  : "bg-amber-50 text-amber-800 border border-amber-200/60"
              }`}
            >
              <Clock size={13} />
              <span>
                {chatSettings.isOpen
                  ? `Active Hours (${chatSettings.setting?.startHour || 7}:00 - ${chatSettings.setting?.endHour || 21}:00)`
                  : "Chat Closed"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Full-Height Chat Container (Split Pane) */}
      <div className="neu-card flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-3xl">
        {/* Left Column: Subject Teacher Thread List (4 cols on lg, 5 on md) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-white/80 flex flex-col h-full bg-white/20">
          {/* Search & Filter Toolbar */}
          <div className="p-3.5 border-b border-white/80 bg-white/30 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachers or subjects..."
                className="neu-input w-full !pl-9 pr-3 py-1.5 text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "neu-btn-primary text-white"
                    : "neu-btn text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({threads.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("doubts")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  filterMode === "doubts"
                    ? "bg-amber-600 text-white font-black shadow-xs"
                    : "neu-btn text-amber-800 hover:text-amber-900"
                }`}
              >
                <HelpCircle size={12} />
                <span>My Doubts</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === "unread"
                    ? "neu-btn-primary text-white"
                    : "neu-btn text-slate-600 hover:text-slate-900"
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/60 scrollbar-slim">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading subject faculty chats...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 font-medium space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p>No conversation threads found.</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = t._id === activeThreadId;
                const teacherName = t.teacherId?.name || "Subject Teacher";
                const initials = teacherName.split(" ").map((n) => n[0]).join("").slice(0, 2);

                return (
                  <button
                    key={t._id}
                    onClick={() => {
                      setActiveThreadId(t._id);
                      setActiveThread(t);
                    }}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 border-l-4 border-l-indigo-600 shadow-inner"
                        : "hover:bg-white/50"
                    }`}
                  >
                    {/* Teacher Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected ? "bg-indigo-600 text-white shadow-xs" : "neu-inset text-indigo-700 font-extrabold"
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-slate-800 truncate">
                          {t.subjectId?.name || "Subject"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold text-slate-600 truncate flex items-center gap-1">
                          <User size={11} className="text-indigo-500" />
                          <span>{teacherName}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-1 font-medium">
                        {t.lastMessageText || "No messages yet. Ask a question below!"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.unreadStudentCount > 0 && (
                        <span className="neu-pill px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold">
                          {t.unreadStudentCount}
                        </span>
                      )}
                      {t.hasUnresolvedDoubts && (
                        <span className="neu-pill px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-200">
                          Doubt
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Thread Messages & Actions */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-white/10">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="px-6 py-3.5 border-b border-white/80 bg-white/40 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-indigo-600 font-black text-sm">
                    {activeThread.teacherId?.name?.[0] || "T"}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <span>{activeThread.subjectId?.name}</span>
                      <span className="neu-pill text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.2">
                        {activeThread.subjectId?.code}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <User size={12} className="text-indigo-500" />
                      <span>Faculty: <strong>{activeThread.teacherId?.name}</strong></span>
                      <span>•</span>
                      <span>{activeThread.classId?.name} - Section {activeThread.section}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeThread.hasUnresolvedDoubts && (
                    <span className="neu-pill text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 border border-amber-200 flex items-center gap-1">
                      <HelpCircle size={13} />
                      <span>Pending Doubt</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Messages Scroll Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 neu-inset m-3 rounded-2xl scrollbar-slim">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-400 py-16 font-medium">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-16 font-medium space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                    <p>No messages yet in this subject. Ask your teacher a doubt below!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderRole === "student";
                    const isTeacher = m.senderRole === "teacher";

                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {/* Sender Label & Badges */}
                        <div className="flex items-center gap-2 mb-1">
                          {isTeacher ? (
                            <span className="neu-pill text-[9px] font-black px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1">
                              <span>Teacher Reply</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold text-slate-600">
                              You
                            </span>
                          )}

                          {isTeacher && (
                            <span className="text-[11px] font-black text-slate-800">
                              {activeThread.teacherId?.name}
                            </span>
                          )}

                          {m.isDoubt && (
                            <span className="neu-pill text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-800">
                              Doubt
                            </span>
                          )}
                          {m.resolved && (
                            <span className="neu-pill text-[9px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800">
                              Resolved
                            </span>
                          )}
                        </div>

                        {/* Message Bubble: Prominently Highlighted for Teacher Reply */}
                        <div
                          className={`max-w-lg px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                            isTeacher
                              ? "neu-card border-2 border-indigo-400/60 bg-indigo-50/70 text-slate-900 shadow-md rounded-tl-none"
                              : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 rounded-tr-none"
                          }`}
                        >
                          {m.text}
                        </div>

                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[9px] text-slate-400 font-medium">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Form with Doubt Tagging */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-white/80 bg-white/40 space-y-2 shrink-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <label className="neu-pill flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50/90 px-3 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDoubt}
                      onChange={(e) => setIsDoubt(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Tag as Academic Doubt</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Teacher will be notified directly
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Ask a doubt or send a message to ${activeThread.teacherId?.name || "Teacher"}...`}
                    className="neu-input flex-1 px-3.5 py-2.5 text-xs font-medium"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageText.trim()}
                    className="neu-btn-primary flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Send size={14} />
                    <span>{sendingMessage ? "Sending..." : "Send"}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 font-medium space-y-3 p-8">
              <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-slate-300">
                <MessageSquare size={26} />
              </div>
              <p>Select a subject faculty thread from the left to view messages and ask doubts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
