"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Bot,
  Search,
  Filter,
  Clock,
  User,
  Sparkles,
  BookOpen,
  Calendar,
} from "lucide-react";

interface AILogItem {
  _id: string;
  userId: { _id: string; name: string; email: string; role: string };
  role: string;
  subjectId?: { _id: string; name: string; code: string };
  feature: string;
  prompt: string;
  response: any;
  timestamp: string;
}

export default function AdminAILogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AILogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [featureFilter, setFeatureFilter] = useState("ALL");

  // AI Daily Limits & Policy Settings
  const [settings, setSettings] = useState({
    dailyLimitPerStudent: 50,
    dailyLimitPerTeacher: 150,
    chatHoursEnabled: false,
    chatStartTime: "07:00",
    chatEndTime: "21:00",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    api.get<{ settings: any }>("/api/ai/settings")
      .then((res) => {
        if (res.settings) {
          setSettings({
            dailyLimitPerStudent: res.settings.dailyLimitPerStudent ?? 50,
            dailyLimitPerTeacher: res.settings.dailyLimitPerTeacher ?? 150,
            chatHoursEnabled: !!res.settings.chatHoursEnabled,
            chatStartTime: res.settings.chatStartTime || "07:00",
            chatEndTime: res.settings.chatEndTime || "21:00",
          });
        }
      })
      .catch((err) => console.warn("Failed to load AI settings:", err.message));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.patch("/api/ai/settings", settings);
      toast("Role daily limits and chat policies saved!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to update settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ logs: AILogItem[] }>("/api/ai/logs");
        setLogs(res.logs || []);
      } catch (err: any) {
        toast(err.message || "Failed to load AI usage logs", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const uName = log.userId?.name || "";
    const promptText = typeof log.prompt === "string" ? log.prompt : JSON.stringify(log.prompt);
    const matchesSearch =
      uName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promptText.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter !== "ALL" && log.role !== roleFilter) return false;
    if (featureFilter !== "ALL" && log.feature !== featureFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600" />
          AI Feature Usage & Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time tracking of AI service requests across student doubts, test generators, feedback suggestions, and effort estimates.
        </p>
      </div>

      {/* AI Daily Limits & Policy Settings Panel */}
      <form onSubmit={handleSaveSettings} className="neu-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/80">
          <div>
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <span>Role-Based AI Daily Limits & Chat Hours</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure maximum AI requests allowed per role per calendar day and manage school-wide chat access windows.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingSettings}
            className="neu-btn-primary px-4 py-2 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            {savingSettings ? "Saving..." : "Save Policies"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-slate-600 block">Student Daily Limit (Queries)</label>
            <input
              type="number"
              min="5"
              max="200"
              value={settings.dailyLimitPerStudent}
              onChange={(e) => setSettings({ ...settings, dailyLimitPerStudent: parseInt(e.target.value) || 0 })}
              className="neu-input w-full p-2.5 rounded-xl font-extrabold text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 block">Teacher Daily Limit (Queries)</label>
            <input
              type="number"
              min="20"
              max="500"
              value={settings.dailyLimitPerTeacher}
              onChange={(e) => setSettings({ ...settings, dailyLimitPerTeacher: parseInt(e.target.value) || 0 })}
              className="neu-input w-full p-2.5 rounded-xl font-extrabold text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 block">Chat Hours Restriction</label>
            <div className="flex items-center h-10 gap-2">
              <input
                type="checkbox"
                id="chatHoursToggle"
                checked={settings.chatHoursEnabled}
                onChange={(e) => setSettings({ ...settings, chatHoursEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="chatHoursToggle" className="cursor-pointer text-slate-700">
                {settings.chatHoursEnabled ? "Enforced (Off-Hours Closed)" : "Disabled (24/7 Open)"}
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 block">Permitted Chat Window</label>
            <div className="flex items-center gap-1.5 h-10">
              <input
                type="time"
                value={settings.chatStartTime}
                onChange={(e) => setSettings({ ...settings, chatStartTime: e.target.value })}
                className="neu-input p-1.5 text-xs font-bold w-1/2 rounded-lg"
              />
              <span className="text-slate-400">to</span>
              <input
                type="time"
                value={settings.chatEndTime}
                onChange={(e) => setSettings({ ...settings, chatEndTime: e.target.value })}
                className="neu-input p-1.5 text-xs font-bold w-1/2 rounded-lg"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, feature, or prompt..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
          >
            <option value="ALL">All Features</option>
            <option value="ask_doubt">Ask Doubt</option>
            <option value="generate_test">Generate Test</option>
            <option value="estimate_effort">Estimate Effort</option>
            <option value="explain_mistake">Explain Mistake</option>
            <option value="suggest_feedback">Suggest Feedback</option>
            <option value="generate_study_plan">Generate Study Plan</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4">Prompt</th>
                <th className="py-3 px-4">Response Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-xs">
                      {log.userId?.name || "System"}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      {log.feature.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs truncate">
                    {typeof log.prompt === "string" ? log.prompt : JSON.stringify(log.prompt)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 max-w-sm truncate font-mono">
                    {typeof log.response === "string"
                      ? log.response
                      : JSON.stringify(log.response)}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No AI usage logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
