"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
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
  Shield,
  Clock,
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
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleCounts = stats?.roleCounts || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-md border border-indigo-100">
              Control Panel
            </span>
            <span className="text-xs text-slate-400">Institutional RBAC &amp; Roster Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Administration</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage user directories, configure academic classes and subjects, assign teachers, and control access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/users"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add User</span>
          </Link>
          <Link
            href="/admin/classes"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FolderPlus size={15} />
            <span>Add Class</span>
          </Link>
          <Link
            href="/admin/users/import"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload size={15} />
            <span>Import CSV</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Users</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.totalUsers ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Across all 7 roles</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Teachers</span>
            <GraduationCap size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{roleCounts.teacher ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Faculty members</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Students</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{roleCounts.student ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Enrolled students</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Parents</span>
            <UserCheck size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{roleCounts.parent ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Registered guardians</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Classes</span>
            <Layers size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.totalClasses ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Active grade sections</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Subjects</span>
            <BookOpen size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.totalSubjects ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Curriculum courses</p>
        </div>
      </div>

      {/* Role Distribution Pill Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Roster Counts by Role</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {["admin", "principal", "coordinator", "teacher", "counsellor", "student", "parent"].map((role) => (
            <div key={role} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">{role}</span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5">{roleCounts[role] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Audit Activity Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Recent Administrative Audit Entries</h2>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5 font-bold">Action</th>
                <th className="py-3 px-5 font-bold">Actor</th>
                <th className="py-3 px-5 font-bold">Target</th>
                <th className="py-3 px-5 font-bold">Details</th>
                <th className="py-3 px-5 font-bold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-800">{log.actor?.name || "System"}</td>
                    <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">{log.targetType}</td>
                    <td className="py-3 px-5 text-slate-600 max-w-xs truncate">
                      {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                    <td className="py-3 px-5 text-slate-400 text-right whitespace-nowrap">
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
