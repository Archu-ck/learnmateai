"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Bot,
  Send,
  Plus,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  MessageSquare,
  Sparkles,
  RotateCcw,
  Square,
  Search,
  BookOpen,
  GraduationCap,
  HelpCircle,
} from "lucide-react";

interface MessageItem {
  id?: string;
  role: "user" | "model" | "assistant";
  content: string;
  thumbsUp?: boolean | null;
  saved?: boolean;
}

interface ConversationSummary {
  _id: string;
  title: string;
  topicId?: { _id: string; name: string } | null;
  updatedAt: string;
}

export default function AiDoubtChat({
  subjectId,
  subjectName,
  initialQuestion = "",
  containerClassName,
}: {
  subjectId: string;
  subjectName: string;
  topics?: any[];
  initialQuestion?: string;
  containerClassName?: string;
}) {
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuestion, setInputQuestion] = useState(initialQuestion);
  const [searchFilter, setSearchFilter] = useState("");

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Load conversations for this subject
  const loadConversations = async () => {
    try {
      const res = await api.get<{ conversations: ConversationSummary[] }>(
        `/api/ai/doubt/conversations?subjectId=${subjectId}`
      );
      setConversations(res.conversations || []);
      if (res.conversations && res.conversations.length > 0 && !activeConvId) {
        selectConversation(res.conversations[0]._id);
      }
    } catch (err: any) {
      console.warn("Could not load conversations:", err.message);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [subjectId]);

  // Select conversation and load messages
  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    setErrorMessage(null);
    try {
      const res = await api.get<{ conversation: any; messages: any[] }>(
        `/api/ai/doubt/conversations/${convId}/messages`
      );
      setMessages(
        (res.messages || []).map((m) => ({
          id: m._id,
          role: m.role,
          content: m.content,
          thumbsUp: m.thumbsUp,
        }))
      );
    } catch (err: any) {
      toast(err.message || "Failed to load conversation messages", "error");
    }
  };

  // Start a fresh conversation
  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setErrorMessage(null);
    setInputQuestion("");
  };

  // Stream send question
  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q || isStreaming) return;

    setErrorMessage(null);
    setInputQuestion("");
    setIsStreaming(true);
    setStreamingText("");

    // Add user message to UI immediately
    const userMsg: MessageItem = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/ai/doubt/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subjectId,
          conversationId: activeConvId || undefined,
          question: q,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Error ${response.status}: Failed to stream answer`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported by browser");

      const decoder = new TextDecoder();
      let accumulated = "";
      let newConvId = activeConvId;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonText = line.replace("data: ", "").trim();
            if (!jsonText) continue;

            try {
              const data = JSON.parse(jsonText);
              if (data.chunk) {
                accumulated += data.chunk;
                setStreamingText(accumulated);
              }
              if (data.done) {
                if (data.conversationId) {
                  newConvId = data.conversationId;
                  setActiveConvId(data.conversationId);
                }
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (pErr) {
              // Ignore partial chunk parse error
            }
          }
        }
      }

      // Finalize model message
      if (accumulated) {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: accumulated },
        ]);
        setStreamingText("");
      }

      // Refresh conversations list in background
      loadConversations();
    } catch (err: any) {
      if (err.name === "AbortError") {
        if (streamingText) {
          setMessages((prev) => [
            ...prev,
            { role: "model", content: streamingText + " [Stopped]" },
          ]);
          setStreamingText("");
        }
      } else {
        setErrorMessage(err.message || "Failed to reach AI Tutor.");
        toast(err.message || "AI Tutor error", "error");
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast("Copied explanation to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save to Notes
  const handleSaveToNotes = async (content: string) => {
    try {
      await api.post("/api/ai/doubt/save-note", {
        subjectId,
        content,
      });
      toast("Saved answer into your personal revision notes!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to save note", "error");
    }
  };

  // Thumbs up / down
  const handleToggleFeedback = async (msg: MessageItem, isUp: boolean) => {
    if (!msg.id) return;
    try {
      const newStatus = msg.thumbsUp === isUp ? null : isUp;
      await api.post("/api/ai/doubt/feedback", {
        messageId: msg.id,
        thumbsUp: newStatus,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, thumbsUp: newStatus } : m))
      );
      toast(isUp ? "Marked as helpful!" : "Feedback recorded.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to record feedback", "error");
    }
  };

  // Escalate to Teacher
  const handleSendToTeacher = async (question: string, aiAnswer: string) => {
    try {
      await api.post("/api/ai/doubt/send-to-teacher", {
        subjectId,
        question,
        aiAnswer,
      });
      toast("Escalated to your subject teacher's inbox as a Doubt!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to escalate to teacher", "error");
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      className={
        containerClassName ||
        "grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-270px)] min-h-[460px] max-h-[640px] w-full"
      }
    >
      {/* LEFT COLUMN: Discussions Drawer */}
      <div className="lg:col-span-4 neu-card p-4 sm:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        <div className="space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-white/80">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Bot size={15} className="text-indigo-600" />
              <span>Doubt Threads</span>
            </h3>
            <button
              onClick={handleStartNewChat}
              className="neu-btn px-2.5 py-1 text-xs font-bold text-indigo-700 flex items-center gap-1 hover:text-indigo-800 cursor-pointer"
              title="Start a new discussion thread"
            >
              <Plus size={13} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search conversations */}
          <div className="shrink-0 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search discussions..."
              className="neu-input !pl-8 pr-3 py-1.5 text-xs w-full font-medium"
            />
          </div>

          {/* Conversations list */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 scrollbar-slim">
            {filteredConversations.map((c) => {
              const isSelected = c._id === activeConvId;
              return (
                <button
                  key={c._id}
                  onClick={() => selectConversation(c._id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer block ${
                    isSelected
                      ? "neu-inset border-l-3 border-indigo-600 bg-white/40"
                      : "neu-card-sm hover:bg-white/60"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="truncate max-w-[140px] text-indigo-600 font-semibold">
                      {c.topicId?.name || subjectName}
                    </span>
                    <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs italic font-medium">
                No discussions yet. Click "New Chat" to ask your first question!
              </div>
            )}
          </div>
        </div>

        {/* Tip at bottom */}
        <div className="shrink-0 pt-3 border-t border-white/80 text-[11px] text-slate-500 font-medium">
          💡 <strong className="text-slate-700">Explaining Tutor:</strong> Step-by-step guidance tailored for Class 10 mastery.
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Panel */}
      <div className="lg:col-span-8 neu-card p-4 sm:p-5 flex flex-col h-full min-h-0 overflow-hidden">
        {/* Header Strip with Topic Selector REMOVED, showing clean status & badges */}
        <div className="shrink-0 flex items-center justify-between pb-3 border-b border-white/80 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-xs">
              <Bot size={17} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 flex-wrap">
                <span>VidyaAI Tutor</span>
                <span className="neu-pill text-[9px] font-black px-2 py-0.5 text-emerald-800 bg-emerald-50">
                  Active
                </span>
                <span className="neu-pill text-[9px] font-black px-2 py-0.5 text-indigo-700 bg-indigo-50 flex items-center gap-1">
                  <BookOpen size={10} />
                  <span>Academic Study Only</span>
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {subjectName} • Any Study Topic Welcome
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="neu-pill text-[10px] font-black px-2.5 py-1 text-indigo-700 bg-indigo-50/80 flex items-center gap-1.5 border border-indigo-100 shadow-xs">
              <Sparkles size={11} className="text-indigo-600" />
              <span>Step-by-Step Explanations</span>
            </span>
            <span className="neu-pill text-[10px] font-bold px-2.5 py-1 text-slate-600 bg-white/70 hidden sm:flex items-center gap-1">
              <GraduationCap size={12} className="text-indigo-500" />
              <span>Class 10 Level</span>
            </span>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-slim">
          {messages.length === 0 && !streamingText && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-indigo-600">
                <Sparkles size={26} />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                Ask Any Study Doubt in {subjectName}
              </h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed font-medium">
                Stuck on a concept, formula, derivation, or problem? Ask below! VidyaAI provides guided, step-by-step Class 10 explanations with intuitive reasoning instead of blunt answers.
              </p>
            </div>
          )}

          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            const lastUserQuestion = !isUser
              ? messages.slice(0, idx).reverse().find((x) => x.role === "user")?.content || ""
              : "";

            return (
              <div
                key={m.id || idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs font-medium space-y-2 leading-relaxed ${
                    isUser
                      ? "neu-btn-primary text-white shadow-sm"
                      : "neu-card border border-white/80 text-slate-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {!isUser && (
                    <div className="pt-2 mt-2 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(m.content, String(m.id || idx))}
                          className="neu-pill px-2 py-0.5 text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === String(m.id || idx) ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSaveToNotes(m.content)}
                          className="neu-pill px-2 py-0.5 text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                          title="Save this answer to your personal notes"
                        >
                          <Bookmark size={11} />
                          <span>Save Note</span>
                        </button>

                        <button
                          onClick={() => handleSendToTeacher(lastUserQuestion, m.content)}
                          className="neu-pill px-2 py-0.5 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer font-bold"
                          title="Escalate question and AI answer to your subject teacher"
                        >
                          <MessageSquare size={11} />
                          <span>Send to Teacher</span>
                        </button>
                      </div>

                      {/* Thumbs Feedback */}
                      {m.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleFeedback(m, true)}
                            className={`p-1 rounded-lg hover:bg-white cursor-pointer ${
                              m.thumbsUp === true ? "text-emerald-600 font-bold" : "text-slate-400"
                            }`}
                            title="Helpful explanation"
                          >
                            <ThumbsUp size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleFeedback(m, false)}
                            className={`p-1 rounded-lg hover:bg-white cursor-pointer ${
                              m.thumbsUp === false ? "text-rose-600 font-bold" : "text-slate-400"
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Currently Streaming AI response */}
          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25 animate-pulse">
                <Bot size={15} />
              </div>
              <div className="max-w-[85%] sm:max-w-[78%] neu-card border border-white/80 p-4 text-xs font-medium text-slate-800 space-y-2 leading-relaxed">
                <div className="whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-2 h-3.5 bg-indigo-600 ml-1 animate-pulse align-middle" />
                </div>
                <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1.5 pt-1">
                  <Sparkles size={11} className="animate-spin" />
                  <span>VidyaAI is formulating step-by-step guidance...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="neu-card border border-rose-200 bg-rose-50/50 p-3 rounded-xl flex items-center justify-between text-xs text-rose-800">
              <span>{errorMessage}</span>
              <button
                onClick={() => handleSendMessage()}
                className="neu-btn px-2.5 py-1 text-[11px] font-bold text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="shrink-0 flex items-center gap-2 py-2 overflow-x-auto scrollbar-slim">
          {[
            { label: "Give me a hint", icon: "💡" },
            { label: "Explain simply", icon: "🔍" },
            { label: "Give me an example", icon: "📝" },
            { label: "Quiz me", icon: "🎯" },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSendMessage(chip.label)}
              className="neu-pill px-3 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/70 whitespace-nowrap cursor-pointer transition-all disabled:opacity-50"
            >
              <span>{chip.icon}</span> <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Input Form & Action Bar - Guaranteed visible & pinned */}
        <div className="shrink-0 pt-2 border-t border-white/80 bg-[#edf2f7]/80 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask any study doubt in ${subjectName} or school curriculum... (Press Enter to ask)`}
                rows={1}
                disabled={isStreaming}
                className="neu-input w-full resize-none text-xs font-medium px-3.5 py-2.5 rounded-xl min-h-[42px] max-h-24 leading-relaxed"
              />
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="neu-btn h-[42px] px-3.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer shrink-0"
                title="Stop streaming response"
              >
                <Square size={13} className="fill-rose-600" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputQuestion.trim()}
                className="neu-btn-primary h-[42px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-40"
              >
                <Send size={13} />
                <span>Ask</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
