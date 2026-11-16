"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { ShieldCheck, Lock, Save, RotateCcw, AlertTriangle } from "lucide-react";

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

  const roleNames = ["admin", "principal", "coordinator", "teacher", "counsellor", "student", "parent"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Role Permissions Matrix</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure granular capability keys across all system roles. Changes apply instantly to backend authorization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRoles}
            disabled={saving}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? "Saving Changes..." : "Save Permissions"}</span>
          </button>
        </div>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        <span>
          <strong>Lockout Protection Active:</strong> For safety, <code>roles.manage</code> and <code>users.create</code> are permanently locked on the <strong>admin</strong> role to ensure administrators can never lock themselves out.
        </span>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold sticky left-0 bg-slate-50 z-10 w-72">
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
                    Loading permissions matrix...
                  </td>
                </tr>
              ) : (
                allPermissions.map((perm) => (
                  <tr key={perm} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800 text-[11px] sticky left-0 bg-white">
                      {perm}
                    </td>

                    {roleNames.map((role) => {
                      const checked = matrix[role]?.has(perm) ?? false;
                      const locked = isLocked(role, perm);

                      return (
                        <td key={role} className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {locked ? (
                              <div
                                title="Locked by system lockout prevention"
                                className="w-5 h-5 rounded bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 cursor-not-allowed"
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
