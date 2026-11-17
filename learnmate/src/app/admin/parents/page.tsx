"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { UserCheck, Link2, X, Edit2 } from "lucide-react";

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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Parent-Student Linking</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Connect guardians to their enrolled children. A student may have multiple guardians linked.
          </p>
        </div>

        <button
          onClick={() => openLinkModal()}
          className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Link2 size={16} />
          <span>Link Parent to Students</span>
        </button>
      </div>

      <div className="neu-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-400 uppercase tracking-wider text-[11px]">
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
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading parent records...</span>
                  </td>
                </tr>
              ) : parents.length > 0 ? (
                parents.map((p) => (
                  <tr key={p.id} className="hover:bg-white/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {p.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.email}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.children && p.children.length > 0 ? (
                          p.children.map((child, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-500/10 text-indigo-700 border border-indigo-200/40 inline-flex items-center gap-1"
                            >
                              <span>{child.name}</span>
                              {child.admissionNo && (
                                <span className="font-mono text-[9px] text-slate-400">({child.admissionNo})</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">No children linked</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openLinkModal(p)}
                        className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit Links</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No parents registered or linked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="neu-card bg-[#f0f3f8] max-w-md w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <h2 className="text-base font-extrabold text-slate-800">Link Parent to Students</h2>
              <button onClick={() => setIsOpen(false)} className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Account</label>
                <select
                  required
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="neu-input w-full cursor-pointer"
                >
                  <option value="">Select Parent</option>
                  {allParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Children / Students ({form.studentIds.length} selected)
                </label>
                <select
                  multiple
                  value={form.studentIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setForm({ ...form, studentIds: selected });
                  }}
                  className="neu-input w-full h-36 cursor-pointer"
                >
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl / Cmd to select multiple students</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl font-bold cursor-pointer"
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
