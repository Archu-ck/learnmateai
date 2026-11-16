"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { BookOpen, Plus, Edit2, Trash2, X, Layers } from "lucide-react";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  classes: Array<{ id: string; name: string }>;
  createdAt: string;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function SubjectsPage() {
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    classIds: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [subjRes, classRes] = await Promise.all([
        api.get<{ subjects: SubjectItem[] }>("/api/admin/subjects"),
        api.get<{ classes: ClassOption[] }>("/api/admin/classes"),
      ]);
      setSubjects(subjRes.subjects || []);
      setClasses(classRes.classes || []);
    } catch (err: any) {
      toast(err.message || "Failed to load subjects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingSubject(null);
    setForm({ name: "", code: "", classIds: [] });
    setIsOpen(true);
  };

  const openEdit = (s: SubjectItem) => {
    setEditingSubject(s);
    setForm({
      name: s.name,
      code: s.code,
      classIds: s.classes.map((c) => c.id),
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.patch(`/api/admin/subjects/${editingSubject.id}`, form);
        toast(`Subject ${form.name} updated.`);
      } else {
        await api.post("/api/admin/subjects", form);
        toast(`Subject ${form.name} created.`);
      }
      setIsOpen(false);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to save subject", "error");
    }
  };

  const handleDelete = async (s: SubjectItem) => {
    if (!confirm(`Delete subject ${s.name}?`)) return;
    try {
      await api.delete(`/api/admin/subjects/${s.id}`);
      toast(`Subject ${s.name} deleted.`);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to delete subject", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Academic Subjects</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Define curriculum subjects and attach them to target classes.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Subject Name</th>
                <th className="py-3 px-4 font-bold">Code</th>
                <th className="py-3 px-4 font-bold">Assigned Classes</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Loading subjects...
                  </td>
                </tr>
              ) : subjects.length > 0 ? (
                subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {s.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.classes && s.classes.length > 0 ? (
                          s.classes.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">All / Unlinked</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                          title="Edit Subject"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No subjects registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingSubject ? "Edit Subject" : "Create New Subject"}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics or Physics"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH101"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applicable Classes</label>
                <select
                  multiple
                  value={form.classIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    setForm({ ...form, classIds: selected });
                  }}
                  className="w-full h-28 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl / Cmd to select multiple classes</p>
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
