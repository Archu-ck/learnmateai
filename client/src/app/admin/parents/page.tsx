"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { UserCheck, UserPlus, Users, Link2, X } from "lucide-react";

interface ParentItem {
  id: string;
  name: string;
  email: string;
  children: Array<{
    _id?: string;
    id?: string;
    name: string;
    email: string;
    admissionNo?: string;
    sectionId?: string;
  }>;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function ParentsPage() {
  const { toast } = useToast();

  const [parents, setParents] = useState<ParentItem[]>([]);
  const [allParents, setAllParents] = useState<UserOption[]>([]);
  const [allStudents, setAllStudents] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    parentId: "",
    studentIds: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [linksRes, pRes, sRes] = await Promise.all([
        api.get<{ parents: ParentItem[] }>("/api/admin/parent-links"),
        api.get<{ users: UserOption[] }>("/api/admin/users?role=parent&limit=100"),
        api.get<{ users: UserOption[] }>("/api/admin/users?role=student&limit=200"),
      ]);

      setParents(linksRes.parents || []);
      setAllParents(pRes.users || []);
      setAllStudents(sRes.users || []);
    } catch (err: any) {
      toast(err.message || "Failed to load parent links", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openLinkModal = (parent?: ParentItem) => {
    setForm({
      parentId: parent ? parent.id : allParents[0]?.id || "",
      studentIds: parent ? parent.children.map((c) => c._id || c.id || "") : [],
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentId || form.studentIds.length === 0) {
      toast("Please select a parent and at least one student.", "error");
      return;
    }

    try {
      const res = await api.post<{ message: string }>("/api/admin/parent-links", form);
      toast(res.message);
      setIsOpen(false);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to link parent", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Parent-Student Linking</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Connect guardians to their enrolled children. A student may have multiple guardians linked.
          </p>
        </div>

        <button
          onClick={() => openLinkModal()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Link2 size={15} />
          <span>Link Parent to Students</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Parent / Guardian</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Linked Children (Students)</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Loading parent accounts...
                  </td>
                </tr>
              ) : parents.length > 0 ? (
                parents.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700">
                        {p.name.charAt(0)}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.email}</td>
                    <td className="py-3 px-4">
                      {p.children && p.children.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {p.children.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-medium"
                            >
                              {c.name} {c.admissionNo ? `(${c.admissionNo})` : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No children linked yet</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openLinkModal(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-200 rounded-lg bg-indigo-50/50"
                      >
                        Modify Links
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No parents registered yet. Add a user with role 'parent' to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Link Parent to Students</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Parent</label>
                <select
                  required
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Parent Account</option>
                  {allParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Children ({form.studentIds.length} selected)
                </label>
                <select
                  multiple
                  value={form.studentIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setForm({ ...form, studentIds: selected });
                  }}
                  className="w-full h-36 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl / Cmd to choose multiple children</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Links
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
