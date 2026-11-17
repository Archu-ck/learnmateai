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
  Sparkles,
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

  // Save Class (Create / Update)
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const sections = classForm.sectionsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (sections.length === 0) {
      toast("Please provide at least one section (e.g. A, B)", "error");
      return;
    }

    try {
      if (editingClass) {
        const res = await api.put<{ message: string; class: ClassItem }>(
          `/api/admin/classes/${editingClass.id}`,
          {
            name: classForm.name,
            sections,
            academicYear: classForm.academicYear,
          }
        );
        toast(res.message);
      } else {
        const res = await api.post<{ message: string; class: ClassItem }>("/api/admin/classes", {
          name: classForm.name,
          sections,
          academicYear: classForm.academicYear,
        });
        toast(res.message);
        setSelectedClassId(res.class.id);
      }

      setIsAddClassOpen(false);
      setEditingClass(null);
      setClassForm({ name: "", sectionsStr: "A, B", academicYear: "2026-2027" });
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to save class", "error");
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    if (!confirm(`Are you sure you want to delete ${cls.name}?`)) return;
    try {
      const res = await api.delete<{ message: string }>(`/api/admin/classes/${cls.id}`);
      toast(res.message);
      if (selectedClassId === cls.id) setSelectedClassId(null);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to delete class", "error");
    }
  };

  // Assign Teacher Submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ message: string; assignment: TeacherAssignmentItem }>(
        "/api/admin/teacher-assignments",
        assignForm
      );
      toast(res.message);
      setIsAssignOpen(false);
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to assign teacher", "error");
    }
  };

  // Enrol Students Submit
  const handleEnrolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrolForm.studentIds.length === 0) {
      toast("Please select at least one student to enrol", "error");
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
      loadData();
    } catch (err: any) {
      toast(err.message || "Failed to enrol students", "error");
    }
  };

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Classes, Sections &amp; Enrolments
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure academic grade rosters, assign subject teachers, designate class teachers, and enrol learners.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClass(null);
            setClassForm({ name: "", sectionsStr: "A, B", academicYear: "2026-2027" });
            setIsAddClassOpen(true);
          }}
          className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Classes List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="neu-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Academic Classes ({classes.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {classes.map((cls) => {
                const isSelected = cls.id === (activeClass?.id || "");
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                        : "neu-card hover:bg-white/80 text-slate-700"
                    }`}
                  >
                    <div>
                      <p className={`font-extrabold text-sm ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {cls.name}
                      </p>
                      <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                        Sections: {cls.sections.join(", ")} • {cls.studentCount || 0} Students
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          setClassForm({
                            name: cls.name,
                            sectionsStr: cls.sections.join(", "),
                            academicYear: cls.academicYear,
                          });
                          setIsAddClassOpen(true);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? "hover:bg-white/20 text-white" : "neu-btn text-slate-500 hover:text-indigo-600"
                        }`}
                        title="Edit Class"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? "hover:bg-white/20 text-white" : "neu-btn text-slate-500 hover:text-rose-600"
                        }`}
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
        <div className="lg:col-span-2 space-y-6">
          {activeClass ? (
            <>
              {/* Active Class Header Card */}
              <div className="neu-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-700 rounded-md border border-indigo-200/40">
                      Active Class Workspace
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Academic Year {activeClass.academicYear}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{activeClass.name}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Sections: {activeClass.sections.join(", ")} • {activeClass.studentCount} Enrolled Students
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => {
                      setEnrolForm({
                        classId: activeClass.id,
                        sectionId: activeClass.sections[0] || "A",
                        studentIds: [],
                      });
                      setIsEnrolOpen(true);
                    }}
                    className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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

                  return (
                    <div key={sec} className="neu-card p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-200/50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {sec}
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-800">
                            {activeClass.name} — Section {sec}
                          </h3>
                        </div>

                      </div>

                      {/* Enrolled Students in this section */}
                      {(() => {
                        const secStudents = students.filter(
                          (s) => s.classId === activeClass.id && s.sectionId === sec
                        );
                        return (
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Enrolled Students ({secStudents.length})
                            </p>
                            {secStudents.length > 0 ? (
                              <div className="neu-inset p-3 overflow-x-auto text-xs">
                                <table className="w-full text-left min-w-[420px]">
                                  <thead className="text-slate-500 font-bold text-[11px] border-b border-slate-200/60">
                                    <tr>
                                      <th className="py-2 px-3">Name</th>
                                      <th className="py-2 px-3">Admission No</th>
                                      <th className="py-2 px-3">Email</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {secStudents.map((s) => (
                                      <tr key={s.id} className="hover:bg-white/40">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{s.name}</td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                          {s.admissionNo || "—"}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-500">{s.email}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="neu-inset p-6 text-center text-slate-400 text-xs">
                                No students enrolled in Section {sec} yet. Click &quot;Enrol Students&quot; above to add learners.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="neu-card p-12 text-center text-slate-400 text-sm">
              No classes created yet. Click &quot;Add New Class&quot; to set up your academic roster.
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT CLASS MODAL */}
      {isAddClassOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="neu-card bg-[#f0f3f8] max-w-md w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <h2 className="text-base font-extrabold text-slate-800">
                {editingClass ? "Edit Class" : "Create New Class"}
              </h2>
              <button
                onClick={() => setIsAddClassOpen(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 8, Grade 10"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sections (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="A, B, C"
                  value={classForm.sectionsStr}
                  onChange={(e) => setClassForm({ ...classForm, sectionsStr: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  placeholder="2026-2027"
                  value={classForm.academicYear}
                  onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ENROL STUDENTS MODAL */}
      {isEnrolOpen && activeClass && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="neu-card bg-[#f0f3f8] max-w-lg w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Enrol Students</h2>
                <p className="text-xs text-slate-400 font-medium">To {activeClass.name}</p>
              </div>
              <button
                onClick={() => setIsEnrolOpen(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEnrolSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Section</label>
                <select
                  value={enrolForm.sectionId}
                  onChange={(e) => setEnrolForm({ ...enrolForm, sectionId: e.target.value })}
                  className="neu-input w-full cursor-pointer"
                >
                  {activeClass.sections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Students ({enrolForm.studentIds.length} selected)
                </label>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Hold Ctrl / Cmd to select multiple students to move or enrol into this section.
                </p>
                <select
                  multiple
                  value={enrolForm.studentIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setEnrolForm({ ...enrolForm, studentIds: selected });
                  }}
                  className="neu-input w-full h-44 cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNo || "No Adm"} - {s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEnrolOpen(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Complete Enrolment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
