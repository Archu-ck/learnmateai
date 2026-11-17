"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Lock, Save, RotateCcw, AlertTriangle } from "lucide-react";

interface RoleData {
  role: string;
  permissions: string[];
}

export default function RolesMatrixPage() {
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ roles: RoleData[]; allPermissions: string[] }>("/api/admin/roles");
      setRoles(res.roles);
      setAllPermissions(res.allPermissions);

      const initialMatrix: Record<string, Set<string>> = {};
      for (const r of res.roles) {
        initialMatrix[r.role] = new Set(r.permissions || []);
      }
      setMatrix(initialMatrix);
    } catch (err: any) {
      toast(err.message || "Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const togglePermission = (role: string, perm: string) => {
    // Lockout protection guard on client
    if (role === "admin" && (perm === "roles.manage" || perm === "users.create")) {
      return;
    }

    setMatrix((prev) => {
      const rolePerms = new Set(prev[role] || []);
      if (rolePerms.has(perm)) {
        rolePerms.delete(perm);
      } else {
        rolePerms.add(perm);
      }
      return {
        ...prev,
        [role]: rolePerms,
      };
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const r of roles) {
        const perms = Array.from(matrix[r.role] || []);
        await api.put(`/api/admin/roles/${r.role}`, { permissions: perms });
      }
      toast("Role permissions updated successfully. Changes take effect immediately.");
      loadRoles();
    } catch (err: any) {
      toast(err.message || "Failed to save permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  const isLocked = (role: string, perm: string) => {
    return role === "admin" && (perm === "roles.manage" || perm === "users.create");
  };

  const roleNames = ["admin", "principal", "teacher", "student", "parent"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Role Permissions Matrix</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure granular capability keys across all system roles. Changes apply instantly to backend authorization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRoles}
            disabled={saving}
            className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? "Saving Changes..." : "Save Permissions"}</span>
          </button>
        </div>
      </div>

      <div className="neu-card p-4 flex items-center gap-3 text-xs text-amber-800">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle size={18} />
        </div>
        <span>
          <strong>Lockout Protection Active:</strong> For safety, <code className="font-mono bg-white/70 px-1 py-0.5 rounded">roles.manage</code> and <code className="font-mono bg-white/70 px-1 py-0.5 rounded">users.create</code> are permanently locked on the <strong>admin</strong> role to ensure administrators can never lock themselves out.
        </span>
      </div>

      {/* Permissions Matrix Table */}
      <div className="neu-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-500 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold sticky left-0 bg-[#f0f3f8] z-10 w-52 sm:w-72 border-r border-slate-200/60">
                  Permission Key
                </th>
                {roleNames.map((role) => (
                  <th key={role} className="py-3 px-3 text-center font-bold">
                    <span className="capitalize">{role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading permissions matrix...</span>
                  </td>
                </tr>
              ) : (
                allPermissions.map((perm) => (
                  <tr key={perm} className="hover:bg-white/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-[11px] sticky left-0 bg-[#f0f3f8] border-r border-slate-200/60 truncate max-w-[160px] sm:max-w-none">
                      {perm}
                    </td>

                    {roleNames.map((role) => {
                      const checked = matrix[role]?.has(perm) ?? false;
                      const locked = isLocked(role, perm);

                      return (
                        <td key={role} className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {locked ? (
                              <div
                                title="Locked by system lockout prevention"
                                className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-300 flex items-center justify-center text-indigo-700 cursor-not-allowed shadow-xs"
                              >
                                <Lock size={12} />
                              </div>
                            ) : (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(role, perm)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
