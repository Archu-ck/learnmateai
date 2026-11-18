"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { getSocket } from "@/lib/socket";
import { SkeletonChatInbox } from "@/components/Skeleton";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  Sparkles,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react";

interface ChatThreadItem {
  _id: string;
  studentId: { _id: string; name: string; email: string; rollNumber?: string; sectionId?: string };
  teacherId: { _id: string; name: string };
  subjectId: { _id: string; name: string; code: string };
  classId: { _id: string; name: string };
  section: string;
  lastMessageText: string;
  unreadTeacherCount: number;
  hasUnresolvedDoubts: boolean;
  updatedAt: string;
}

export default function TeacherChatInboxPage() {
  const { toast } = useToast();

  const [threads, setThreads] = useState<ChatThreadItem[]>(() => {
    return api.getCached<{ threads: ChatThreadItem[] }>("/api/chat/threads")?.threads || [];
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    const cached = api.getCached<{ threads: ChatThreadItem[] }>("/api/chat/threads")?.threads || [];
    return cached.length > 0 ? cached[0]._id : null;
  });

  const [activeThread, setActiveThread] = useState<ChatThreadItem | null>(() => {
    const cached = api.getCached<{ threads: ChatThreadItem[] }>("/api/chat/threads")?.threads || [];
    return cached.length > 0 ? cached[0] : null;
  });

  const [messages, setMessages] = useState<any[]>(() => {
    const cachedThreads = api.getCached<{ threads: ChatThreadItem[] }>("/api/chat/threads")?.threads || [];
    if (cachedThreads.length > 0) {
      const firstId = cachedThreads[0]._id;
      return api.getCached<{ messages: any[] }>(`/api/chat/thread?threadId=${firstId}`)?.messages || [];
    }
    return [];
  });

  const [loadingThreads, setLoadingThreads] = useState<boolean>(() => {
    return threads.length === 0;
  });
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "doubts" | "unread">("all");

  // Message Form
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Chat Settings (Hours)
  const [chatSettings, setChatSettings] = useState<{ isOpen: boolean; setting: any } | null>(() => {
    return api.getCached<{ isOpen: boolean; setting: any }>("/api/chat/settings") || null;
  });

  const quickReplies = [
    "Great question! Let's review this in class tomorrow.",
    "Please check the worked examples in Lesson 2 notes.",
    "Remember to invert signs when moving across the equals sign.",
    "I have updated the lesson notes with a step-by-step hint for this.",
  ];

  // Load All Threads
  const loadThreads = async () => {
    const hasCached = threads.length > 0;
    try {
      if (!hasCached) setLoadingThreads(true);
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
      if (!hasCached) toast(err.message || "Failed to load chat inbox", "error");
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
        prev.map((t) => (t._id === threadId ? { ...t, unreadTeacherCount: 0 } : t))
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

  // Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThreadId) return;

    try {
      setSendingReply(true);
      const res = await api.post<any>("/api/chat/message", {
        threadId: activeThreadId,
        text: replyText.trim(),
      });
      setMessages((prev) => [...prev, res.message]);
      setReplyText("");
      toast("Reply sent to student", "success");
    } catch (err: any) {
      toast(err.message || "Failed to send message", "error");
    } finally {
      setSendingReply(false);
    }
  };

  // Resolve Doubt
  const handleResolveDoubt = async (messageId: string) => {
    try {
      await api.post(`/api/chat/messages/${messageId}/resolve`);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, resolved: true } : m))
      );
      toast("Doubt marked as resolved", "success");
    } catch (err: any) {
      toast(err.message || "Failed to resolve doubt", "error");
    }
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const sName = t.studentId?.name || "";
    const subName = t.subjectId?.name || "";
    const matchesSearch =
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === "doubts") return t.hasUnresolvedDoubts;
    if (filterMode === "unread") return t.unreadTeacherCount > 0;
    return true;
  });

  const totalDoubts = threads.filter((t) => t.hasUnresolvedDoubts).length;
  const totalUnread = threads.reduce((acc, t) => acc + (t.unreadTeacherCount || 0), 0);

  return (
    <div className="h-full flex flex-col w-full font-sans min-h-0 overflow-hidden">
      {/* Top Header Bar */}
      <div className="neu-card px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
              <span>Teacher Chat Inbox</span>
              <span className="neu-pill px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50">
                1-on-1 &amp; Doubts
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Direct student consultations, question threads, and verified doubt resolution.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {totalUnread > 0 && (
            <span className="neu-pill text-xs font-black px-3 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>{totalUnread} Unread Messages</span>
            </span>
          )}

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
      {loadingThreads ? (
        <SkeletonChatInbox />
      ) : (
        <div className="neu-card flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-3xl">
          {/* Left Column: Thread List (4 cols on lg, 5 on md) */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-white/80 flex flex-col h-full min-h-0 bg-white/20">
          {/* Search & Filter Toolbar */}
          <div className="p-3.5 border-b border-white/80 bg-white/30 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students or subjects..."
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
                <span>Doubts ({totalDoubts})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === "unread"
                    ? "neu-btn-primary text-white"
                    : totalUnread > 0
                    ? "neu-btn text-indigo-700 font-extrabold bg-indigo-50/80 border border-indigo-200"
                    : "neu-btn text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Unread</span>
                {totalUnread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/60 scrollbar-slim">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">Loading inbox conversations...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 font-medium space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p>No conversation threads found.</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = t._id === activeThreadId;
                const studentName = t.studentId?.name || "Student";
                const initials = studentName.split(" ").map((n) => n[0]).join("").slice(0, 2);

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
                    {/* Student Initials Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected ? "bg-indigo-600 text-white shadow-xs" : "neu-inset text-slate-700"
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-slate-800 truncate">
                          {studentName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold text-indigo-700 truncate">
                          {t.subjectId?.name || "Subject"}
                        </span>
                        <span className="neu-pill text-[9px] font-mono px-1.5 py-0.2 bg-white/70 text-slate-500">
                          Sec {t.section}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-1 font-medium">
                        {t.lastMessageText || "No messages yet"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.unreadTeacherCount > 0 && (
                        <span className="neu-pill px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-black shadow-xs flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          <span>{t.unreadTeacherCount} new</span>
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
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-white/10 overflow-hidden">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="px-6 py-3.5 border-b border-white/80 bg-white/40 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-indigo-600 font-black text-sm">
                    {activeThread.studentId?.name?.[0] || "S"}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <span>{activeThread.studentId?.name}</span>
                      <span className="neu-pill text-[10px] font-mono px-2 py-0.2 bg-slate-100 text-slate-600">
                        Roll: {activeThread.studentId?.rollNumber || "101"}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <BookOpen size={12} className="text-indigo-500" />
                      <span>{activeThread.subjectId?.name}</span>
                      <span>•</span>
                      <span>{activeThread.classId?.name} - Section {activeThread.section}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeThread.hasUnresolvedDoubts && (
                    <span className="neu-pill text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 border border-amber-200 flex items-center gap-1">
                      <HelpCircle size={13} />
                      <span>Active Doubt</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Messages Scroll Feed */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 neu-inset m-3 rounded-2xl scrollbar-slim">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-400 py-16 font-medium">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-16 font-medium space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                    <p>No messages in this thread yet. Send a note to the student below.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderRole === "teacher";
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isMe ? (
                            <span className="neu-pill text-[9px] font-black px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                              Teacher Reply
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold text-slate-700">
                              {activeThread.studentId?.name}
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

                        {/* Message Bubble - Highlighted for Teacher */}
                        <div
                          className={`max-w-lg px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                            isMe
                              ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 rounded-tr-none"
                              : "neu-card border border-white/80 text-slate-800 rounded-tl-none bg-white/70"
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

                          {/* Doubt Resolution Action */}
                          {m.isDoubt && !m.resolved && (
                            <button
                              type="button"
                              onClick={() => handleResolveDoubt(m._id)}
                              className="text-[10px] font-black text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                            >
                              <CheckCircle2 size={12} />
                              <span>Mark Resolved</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Replies Bar */}
              <div className="px-4 py-2 border-t border-white/80 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 bg-white/30 scrollbar-slim">
                <span className="font-extrabold text-slate-500 whitespace-nowrap text-[11px] flex items-center gap-1">
                  <Sparkles size={12} className="text-indigo-600" />
                  <span>Quick:</span>
                </span>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(qr)}
                    className="neu-btn px-3 py-1 text-slate-700 whitespace-nowrap text-[11px] font-semibold cursor-pointer hover:text-indigo-700"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3.5 border-t border-white/80 bg-white/40 flex items-center gap-2.5 shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official reply to the student..."
                  className="neu-input flex-1 px-3.5 py-2.5 text-xs font-medium"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="neu-btn-primary flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send size={14} />
                  <span>{sendingReply ? "Sending..." : "Send"}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 font-medium space-y-3 p-8">
              <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-slate-300">
                <MessageSquare size={26} />
              </div>
              <p>Select a student conversation from the left to view messages and resolve doubts.</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
