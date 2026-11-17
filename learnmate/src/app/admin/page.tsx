"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import StatCard from "@/components/StatCard";
import {
  Users,
  GraduationCap,
  UserCheck,
  Layers,
  BookOpen,
  UserPlus,
  Upload,
  FolderPlus,
  ArrowRight,
  Clock,
  Sparkles,
  Bot,
} from "lucide-react";

interface DashboardStats {
  roleCounts: Record<string, number>;
  totalUsers: number;
  totalClasses: number;
  totalSubjects: number;
  recentLogs: Array<{
    id: string;
    actor: { name: string; email: string; role: string };
    action: string;
    targetType: string;
    targetId: string;
    details: any;
    timestamp: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Stats Assistant State
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  const handleAskStatsQuestion = async (query: string) => {
    if (!query.trim()) return;
    try {
      setQaLoading(true);
      setQaQuestion(query);
      const res = await api.post<{ answer: string; metrics: any }>("/api/ai/admin-stats-qa", {
        question: query,
      });
      setQaAnswer(res.answer);
    } catch (err: any) {
      setQaAnswer("Could not process question. Please verify connection and try again.");
    } finally {
      setQaLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<DashboardStats>("/api/admin/stats");
      setStats(res);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleCounts = stats?.roleCounts || {};

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Top Banner & Quick Actions */}
      <div className="neu-card p-6 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200/60 inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles size={12} className="text-indigo-500" />
              <span>Control Panel</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">RBAC &amp; Institutional Roster</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            School Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage user directories, configure academic classes and subjects, assign teachers, and control role permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Link
            href="/admin/users"
            className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </Link>
          <Link
            href="/admin/classes"
            className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"
          >
            <FolderPlus size={16} className="text-indigo-600" />
            <span>Add Class</span>
          </Link>
          <Link
            href="/admin/users/import"
            className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"
          >
            <Upload size={16} className="text-violet-600" />
            <span>Import CSV</span>
          </Link>
        </div>
      </div>

      {/* Neumorphic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          colorScheme="indigo"
          subtitle="Across all roles"
        />
        <StatCard
          label="Teachers"
          value={roleCounts.teacher ?? 0}
          icon={GraduationCap}
          colorScheme="emerald"
          subtitle="Faculty members"
        />
        <StatCard
          label="Students"
          value={roleCounts.student ?? 0}
          icon={Users}
          colorScheme="sky"
          subtitle="Enrolled learners"
        />
        <StatCard
          label="Parents"
          value={roleCounts.parent ?? 0}
          icon={UserCheck}
          colorScheme="purple"
          subtitle="Registered guardians"
        />
        <StatCard
          label="Classes"
          value={stats?.totalClasses ?? 0}
          icon={Layers}
          colorScheme="amber"
          subtitle="Active sections"
        />
        <StatCard
          label="Subjects"
          value={stats?.totalSubjects ?? 0}
          icon={BookOpen}
          colorScheme="coral"
          subtitle="Curriculum courses"
        />
      </div>

      {/* Role Counts Summary */}
      <div className="neu-card p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Institutional Roster Counts by Role
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {["admin", "principal", "teacher", "student", "parent"].map((role) => (
            <div key={role} className="neu-inset p-4 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {role}
              </span>
              <span className="text-xl font-extrabold text-slate-800 block mt-1">
                {roleCounts[role] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Institutional Stats Assistant Card */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-white/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-indigo-600">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>AI Institutional Stats Assistant</span>
                <span className="neu-pill px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50">
                  Principal Analytics Q&A
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Ask executive questions about enrollment, academic averages, workloads, and school performance.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            "How many students and teachers are enrolled?",
            "What is the overall school grade percentage?",
            "How many classes and subjects are configured?",
            "Summarize our current operational health.",
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskStatsQuestion(chip)}
              className="neu-pill text-[11px] font-bold px-3 py-1 text-slate-600 hover:text-indigo-600 bg-white/60 transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Question Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskStatsQuestion(qaQuestion);
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            placeholder="e.g. What is the teacher-to-student ratio and average performance?"
            className="neu-input flex-1 px-4 py-2.5 text-xs font-medium"
          />
          <button
            type="submit"
            disabled={qaLoading || !qaQuestion.trim()}
            className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
          >
            <Bot size={15} />
            <span>{qaLoading ? "Analyzing..." : "Ask AI"}</span>
          </button>
        </form>

        {/* Answer Box */}
        {qaAnswer && (
          <div className="neu-card-sm p-4 space-y-2 border-indigo-100 bg-indigo-50/20 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Executive Answer</span>
              </span>
              <span className="neu-pill px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-white">
                AI Generated
              </span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
              {qaAnswer}
            </div>
          </div>
        )}
      </div>

      {/* Recent Audit Activity Table */}
      <div className="neu-card p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Administrative Audit Entries</h2>
              <p className="text-[11px] text-slate-400 font-medium">Logged system mutations and access events</p>
            </div>
          </div>
          <Link
            href="/admin/audit"
            className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            <span>View Full Log</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold">Target</th>
                <th className="py-3 px-4 font-bold">Details</th>
                <th className="py-3 px-4 font-bold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-500/10 text-indigo-700 border border-indigo-200/40">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{log.actor?.name || "System"}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{log.targetType}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                      {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-right whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No recent audit activity recorded yet.
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
