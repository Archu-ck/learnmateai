"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { History, Filter, Calendar, RotateCcw, Search } from "lucide-react";

interface AuditLogItem {
  id: string;
  actor: {
    id?: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  timestamp: string;
}

const actionOptions = [
  { value: "all", label: "All Actions" },
  { value: "user.create", label: "User Created" },
  { value: "user.edit", label: "User Edited" },
  { value: "user.disable", label: "User Disabled" },
  { value: "user.enable", label: "User Enabled" },
  { value: "user.role_change", label: "Role Changed" },
  { value: "user.password_reset", label: "Password Reset" },
  { value: "user.password_change", label: "Password Changed" },
  { value: "users.import", label: "CSV Imported" },
  { value: "class.create", label: "Class Created" },
  { value: "class.edit", label: "Class Edited" },
  { value: "subject.create", label: "Subject Created" },
  { value: "teachers.assign", label: "Teacher Assigned" },
  { value: "students.enrol", label: "Students Enrolled" },
  { value: "parents.link", label: "Parent Linked" },
  { value: "role.permissions_update", label: "Permissions Updated" },
];

export default function AuditLogPage() {
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        action: actionFilter,
      });

      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const res = await api.get<{
        logs: AuditLogItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/audit-log?${query.toString()}`);

      setLogs(res.logs);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast(err.message || "Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const resetFilters = () => {
    setActionFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Audit Trail</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Immutable event ledger tracking administrative user modifications, role updates, and system operations.
        </p>
      </div>

      {/* Filter Toolbar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3 text-xs"
      >
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-700">Filter By Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-700">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
          >
            Apply Dates
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold cursor-pointer"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold">Target</th>
                <th className="py-3 px-4 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading audit trail entries...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{log.actor?.name || "System"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actor?.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                        {log.targetType}
                      </span>
                      {log.targetId && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                          {log.targetId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-md">
                      <pre className="text-[10px] font-mono bg-slate-50 p-1.5 rounded border border-slate-100 overflow-x-auto max-h-16">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {logs.length} of {total} audit records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
