"use client";

import { useState } from "react";
import { MessageSquare, Send, X, Bot, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    text: "Hello Aarav! I'm your AI Study Companion for Class X. Need step-by-step help with Quadratic Equations, Physics derivations, or Exam preparation?",
  },
];

export default function AITutorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q) return;

    const userMsg: Message = { role: "user", text: q };

    let reply =
      "Let's break that down methodically. Have you checked formula 4.2 in your NCERT textbook? Which step would you like to verify together?";
    const lower = q.toLowerCase();
    if (lower.includes("quadratic") || lower.includes("equation")) {
      reply =
        "For ax² + bx + c = 0, first compute the discriminant D = b² - 4ac:\n• D > 0: Two distinct real roots\n• D = 0: Two equal real roots (-b/2a)\n• D < 0: No real roots\nWould you like to solve an example problem together?";
    } else if (lower.includes("physics") || lower.includes("induction") || lower.includes("faraday")) {
      reply =
        "Faraday's Law of Electromagnetic Induction states: Induced EMF ε = -dΦ/dt. The negative sign represents Lenz's Law, meaning the induced current opposes the change in magnetic flux that produced it.";
    } else if (lower.includes("essay") || lower.includes("history")) {
      reply =
        "For the 1920-1947 Freedom Struggle essay, organize by 3 phases: 1) Non-Cooperation Movement (1920-22), 2) Civil Disobedience & Salt March (1930), and 3) Quit India Movement (1942). Want an outline for any section?";
    }

    setMessages((prev) => [...prev, userMsg, { role: "assistant", text: reply }]);
    setInput("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 neu-card bg-[#f0f3f8] text-indigo-700 hover:text-indigo-900 rounded-full cursor-pointer hover:scale-105 transition-all shadow-lg"
        title="Open AI Tutor chat"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
          <Bot size={16} />
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-xs font-bold block leading-none">AI Study Tutor</span>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] neu-card bg-[#f0f3f8] flex flex-col overflow-hidden shadow-2xl"
      style={{ height: "520px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/80 bg-gradient-to-r from-indigo-50/70 to-purple-50/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-800">
                LearnMate AI Tutor
              </span>
              <Sparkles size={13} className="text-amber-500" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium block">
              Curriculum aligned • Class X
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="neu-circle w-7 h-7 text-slate-400 hover:text-slate-700 cursor-pointer"
          aria-label="Close tutor panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Suggested prompts pills */}
      <div className="px-4 py-2.5 bg-[#f0f3f8] border-b border-white/60 flex gap-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => handleSend("Explain the quadratic formula step by step")}
          className="whitespace-nowrap px-3 py-1 rounded-full bg-white/90 text-indigo-700 font-semibold border border-indigo-100 hover:bg-indigo-50 transition-colors shadow-2xs"
        >
          ⚡ Quadratic Formula
        </button>
        <button
          onClick={() => handleSend("Explain Faraday's Law of induction")}
          className="whitespace-nowrap px-3 py-1 rounded-full bg-white/90 text-indigo-700 font-semibold border border-indigo-100 hover:bg-indigo-50 transition-colors shadow-2xs"
        >
          🧲 Faraday&apos;s Law
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#f0f3f8] to-[#edf1f8]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 rounded-tr-xs"
                  : "bg-white/90 border border-white/80 text-slate-800 shadow-xs rounded-tl-xs whitespace-pre-line"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3.5 bg-[#f0f3f8] border-t border-white/80">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about your coursework..."
            className="neu-input flex-1 py-2 px-3 text-xs sm:text-sm bg-[#ebf0f6] rounded-xl text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={() => handleSend()}
            className="neu-btn-primary w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
