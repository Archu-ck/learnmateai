"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Layers,
  Plus,
  Users,
  GraduationCap,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  UserPlus,
  BookOpen,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  sections: string[];
  academicYear: string;
  studentCount: number;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

interface TeacherAssignmentItem {
  id: string;
  teacher: { id: string; name: string; email: string } | null;
  class: { id: string; name: string } | null;
  section: string;
  subject: { id: string; name: string; code: string } | null;
  isClassTeacher: boolean;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  admissionNo?: string;
  classId?: string;
  sectionId?: string;
}

export default function ClassesPage() {
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<UserOption[]>([]);
  const [students, setStudents] = useState<UserOption[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active selected class for section management
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEnrolOpen, setIsEnrolOpen] = useState(false);

  // Class Form
  const [classForm, setClassForm] = useState({
    name: "",
    sectionsStr: "A, B",
    academicYear: "2026-2027",
  });

  // Assign Teacher Form
  const [assignForm, setAssignForm] = useState({
    teacherId: "",
    classId: "",
    section: "",
    subjectId: "",
    isClassTeacher: false,
  });

  // Enrol Form
  const [enrolForm, setEnrolForm] = useState({
    classId: "",
    sectionId: "",
    studentIds: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, subjRes, teachRes, stuRes, assignRes] = await Promise.all([
        api.get<{ classes: ClassItem[] }>("/api/admin/classes"),
        api.get<{ subjects: SubjectItem[] }>("/api/admin/subjects"),
        api.get<{ users: UserOption[] }>("/api/admin/users?role=teacher&limit=100"),
        api.get<{ users: UserOption[] }>("/api/admin/users?role=student&limit=200"),
        api.get<{ assignments: TeacherAssignmentItem[] }>("/api/admin/teacher-assignments"),
      ]);

      setClasses(classRes.classes || []);
      setSubjects(subjRes.subjects || []);
      setTeachers(teachRes.users || []);
      setStudents(stuRes.users || []);
      setAssignments(assignRes.assignments || []);

      if (classRes.classes && classRes.classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classRes.classes[0].id);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load classes data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const sections = classForm.sectionsStr
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    try {
      if (editingClass) {
        await api.patch(`/api/admin/classes/${editingClass.id}`, {
          name: classForm.name,
          sections,
          academicYear: classForm.academicYear,
        });
        toast(`Class ${classForm.name} updated.`);
      } else {
        await api.post("/api/admin/classes", {
          name: classForm.name,
          sections,
          academicYear: classForm.academicYear,
        });
        toast(`Class ${classForm.name} created.`);
      }

      setIsAddClassOpen(false);
      setEditingClass(null);
      setClassForm({ name: "", sectionsStr: "A, B", academicYear: "2026-2027" });
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to save class", "error");
    }
  };

  const handleDeleteClass = async (c: ClassItem) => {
    if (!confirm(`Are you sure you want to delete ${c.name}?`)) return;
    try {
      await api.delete(`/api/admin/classes/${c.id}`);
      toast(`Class ${c.name} deleted.`);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to delete class", "error");
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/teacher-assignments", {
        teacherId: assignForm.teacherId,
        classId: assignForm.classId,
        section: assignForm.section,
        subjectId: assignForm.subjectId || null,
        isClassTeacher: assignForm.isClassTeacher,
      });

      toast("Teacher assignment saved successfully.");
      setIsAssignOpen(false);
      setAssignForm({ teacherId: "", classId: "", section: "", subjectId: "", isClassTeacher: false });
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to assign teacher", "error");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Remove this teacher assignment?")) return;
    try {
      await api.delete(`/api/admin/teacher-assignments/${id}`);
      toast("Assignment removed.");
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to delete assignment", "error");
    }
  };

  const handleEnrolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrolForm.studentIds.length === 0) {
      toast("Please select at least one student to enrol.", "error");
      return;
    }

    try {
      const res = await api.post<{ message: string; enrolledCount: number }>("/api/admin/enrol", {
        studentIds: enrolForm.studentIds,
        classId: enrolForm.classId,
        sectionId: enrolForm.sectionId,
      });

      toast(res.message);
      setIsEnrolOpen(false);
      setEnrolForm({ classId: "", sectionId: "", studentIds: [] });
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to enrol students", "error");
    }
  };

  const activeClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Classes &amp; Sections</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure school grades, manage class teachers, attach subject instructors, and enrol students.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClass(null);
            setClassForm({ name: "", sectionsStr: "A, B", academicYear: "2026-2027" });
            setIsAddClassOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add New Class</span>
        </button>
      </div>

      {/* Grid Layout: Classes List on Left, Active Class Detail & Assignments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-1">
              Registered Classes ({classes.length})
            </h2>

            <div className="space-y-2">
              {classes.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-200 text-slate-900 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{cls.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({cls.academicYear})</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {cls.sections.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            Sec {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Users size={12} className="text-indigo-600" />
                        <span>{cls.studentCount}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(cls);
                          setClassForm({
                            name: cls.name,
                            sectionsStr: cls.sections.join(", "),
                            academicYear: cls.academicYear,
                          });
                          setIsAddClassOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        title="Edit Class"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Class"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Class Deep View */}
        <div className="lg:col-span-2 space-y-5">
          {activeClass ? (
            <>
              {/* Active Class Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                      Active Class Workspace
                    </span>
                    <span className="text-xs text-slate-400">Academic Year {activeClass.academicYear}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeClass.name}</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Sections: {activeClass.sections.join(", ")} • {activeClass.studentCount} Enrolled Students
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAssignForm({
                        teacherId: "",
                        classId: activeClass.id,
                        section: activeClass.sections[0] || "A",
                        subjectId: "",
                        isClassTeacher: false,
                      });
                      setIsAssignOpen(true);
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <GraduationCap size={15} />
                    <span>Assign Teacher</span>
                  </button>

                  <button
                    onClick={() => {
                      setEnrolForm({
                        classId: activeClass.id,
                        sectionId: activeClass.sections[0] || "A",
                        studentIds: [],
                      });
                      setIsEnrolOpen(true);
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={15} />
                    <span>Enrol Students</span>
                  </button>
                </div>
              </div>

              {/* Sections Breakdown Cards */}
              <div className="space-y-4">
                {activeClass.sections.map((sec) => {
                  const secAssignments = assignments.filter(
                    (a) => a.class?.id === activeClass.id && a.section === sec
                  );
                  const classTeacher = secAssignments.find((a) => a.isClassTeacher);
                  const subjectTeachers = secAssignments.filter((a) => !a.isClassTeacher);

                  return (
                    <div key={sec} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                            {sec}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {activeClass.name} — Section {sec}
                          </h3>
                        </div>

                        {classTeacher ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold">
                            <ShieldCheck size={14} className="text-amber-600" />
                            <span>Class Teacher: {classTeacher.teacher?.name}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">No class teacher assigned</span>
                        )}
                      </div>

                      {/* Subject Teachers Table */}
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Assigned Teachers &amp; Subjects ({secAssignments.length})
                        </p>
                        {secAssignments.length > 0 ? (
                          <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 text-slate-500 text-[11px]">
                                <tr>
                                  <th className="py-2 px-3">Teacher</th>
                                  <th className="py-2 px-3">Subject</th>
                                  <th className="py-2 px-3">Designation</th>
                                  <th className="py-2 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {secAssignments.map((a) => (
                                  <tr key={a.id} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3 font-bold text-slate-800">
                                      {a.teacher?.name || "Unassigned"}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600">
                                      {a.subject ? `${a.subject.name} (${a.subject.code})` : "General"}
                                    </td>
                                    <td className="py-2 px-3">
                                      {a.isClassTeacher ? (
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                          Class Teacher
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">Subject Teacher</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        onClick={() => handleDeleteAssignment(a.id)}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                        title="Remove Assignment"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 py-2">
                            No faculty assigned to Section {sec} yet.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select or create a class to manage sections and teacher allocations.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingClass ? "Edit Class Details" : "Create New Class"}
              </h2>
              <button
                onClick={() => setIsAddClassOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 8 or Grade 9"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sections (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C"
                  value={classForm.sectionsStr}
                  onChange={(e) => setClassForm({ ...classForm, sectionsStr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  placeholder="2026-2027"
                  value={classForm.academicYear}
                  onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Assign Teacher Allocation</h2>
              <button
                onClick={() => setIsAssignOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Faculty Teacher</label>
                <select
                  required
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={assignForm.classId}
                    onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={assignForm.section}
                    onChange={(e) => setAssignForm({ ...assignForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {classes
                      .find((c) => c.id === assignForm.classId)
                      ?.sections.map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject (Course)</label>
                <select
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">None / General</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="classTeacherCheck"
                  checked={assignForm.isClassTeacher}
                  onChange={(e) => setAssignForm({ ...assignForm, isClassTeacher: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="classTeacherCheck" className="text-xs font-bold text-amber-900 cursor-pointer">
                  Designate as Section Class Teacher
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrol Students Modal */}
      {isEnrolOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Bulk Enrol Students into Section</h2>
              <button
                onClick={() => setIsEnrolOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEnrolSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Class</label>
                  <select
                    value={enrolForm.classId}
                    onChange={(e) => setEnrolForm({ ...enrolForm, classId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Section</label>
                  <select
                    value={enrolForm.sectionId}
                    onChange={(e) => setEnrolForm({ ...enrolForm, sectionId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {classes
                      .find((c) => c.id === enrolForm.classId)
                      ?.sections.map((s) => (
                        <option key={s} value={s}>
                          Section {s}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Students to Enrol ({enrolForm.studentIds.length} selected)
                </label>
                <select
                  multiple
                  value={enrolForm.studentIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setEnrolForm({ ...enrolForm, studentIds: selected });
                  }}
                  className="w-full h-36 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email}) {s.sectionId ? `[Currently in Sec ${s.sectionId}]` : "[Unassigned]"}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl / Cmd to choose multiple students</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnrolOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Enrol Selected Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
