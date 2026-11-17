"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  BookOpen,
  Users,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";

interface ClassOption {
  _id: string;
  name: string;
  sections: string[];
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  isElective: boolean;
}

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface TeacherAssignmentItem {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  section: string;
  isClassTeacher?: boolean;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  admissionNumber?: string;
  rollNumber?: string;
  section: string;
  enrolledSubjectIds: string[];
}

export default function SubjectAllocationPage() {
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("ALL");

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  // Local state for student-by-subject checkbox matrix: studentId -> Set of subjectIds
  const [matrix, setMatrix] = useState<{ [studentId: string]: string[] }>({});

  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassOption | null>(null);

  // Load initial classes list
  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ classes: ClassOption[] }>("/api/admin/subject-allocation/classes");
      setClasses(res.classes || []);
      if (res.classes?.length > 0 && !selectedClassId) {
        setSelectedClassId(res.classes[0]._id);
      }
    } catch (err: any) {
      toast(err.message || "Failed to load classes", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load class details (subjects, teachers, assignments, students) when class changes
  const loadClassAllocationDetails = async (classId: string) => {
    if (!classId) return;
    try {
      setLoading(true);
      const res = await api.get<{
        classInfo: ClassOption;
        subjects: SubjectItem[];
        teachers: TeacherOption[];
        teacherAssignments: TeacherAssignmentItem[];
        students: StudentItem[];
      }>(`/api/admin/subject-allocation/matrix?classId=${classId}`);

      setCurrentClass(res.classInfo);
      setSubjects(res.subjects || []);
      setTeachers(res.teachers || []);
      setTeacherAssignments(res.teacherAssignments || []);
      setStudents(res.students || []);

      // Build local checkbox map: studentId -> string[] of enrolled subject IDs
      const initialMatrix: { [studentId: string]: string[] } = {};
      for (const st of res.students || []) {
        initialMatrix[st.id] = st.enrolledSubjectIds || [];
      }
      setMatrix(initialMatrix);
    } catch (err: any) {
      toast(err.message || "Failed to load allocation matrix for class", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassAllocationDetails(selectedClassId);
    }
  }, [selectedClassId]);

  // Toggle Subject Compulsory vs Elective
  const handleToggleSubjectType = async (subject: SubjectItem) => {
    if (!selectedClassId) return;
    const newIsElective = !subject.isElective;
    try {
      await api.post("/api/admin/subject-allocation/toggle-elective", {
        classId: selectedClassId,
        subjectId: subject.id,
        isElective: newIsElective,
      });

      // Update state locally
      setSubjects((prev) =>
        prev.map((s) => (s.id === subject.id ? { ...s, isElective: newIsElective } : s))
      );

      // If made compulsory, auto-check for all students
      if (!newIsElective) {
        setMatrix((prev) => {
          const updated = { ...prev };
          for (const sId of Object.keys(updated)) {
            if (!updated[sId].includes(subject.id)) {
              updated[sId] = [...updated[sId], subject.id];
            }
          }
          return updated;
        });
      }

      toast(
        `'${subject.name}' set as ${newIsElective ? "Elective" : "Compulsory"}`,
        "success"
      );
    } catch (err: any) {
      toast(err.message || "Failed to update subject type", "error");
    }
  };

  // Handle teacher assignment dropdown change
  const handleAssignTeacher = async (
    section: string,
    subjectId: string,
    teacherId: string
  ) => {
    try {
      await api.post("/api/admin/subject-allocation/assign-teacher", {
        classId: selectedClassId,
        section,
        subjectId,
        teacherId: teacherId || null,
      });

      // Refresh teacher assignments
      setTeacherAssignments((prev) => {
        const filtered = prev.filter(
          (ta) => !(ta.section === section && ta.subjectId === subjectId)
        );
        if (teacherId) {
          const tObj = teachers.find((t) => t.id === teacherId);
          filtered.push({
            id: `temp-${Date.now()}`,
            classId: selectedClassId,
            section,
            subjectId,
            subjectName: subjects.find((s) => s.id === subjectId)?.name || "",
            teacherId,
            teacherName: tObj?.name || "",
          } as any);
        }
        return filtered;
      });

      toast("Teacher assignment updated", "success");
    } catch (err: any) {
      toast(err.message || "Failed to assign teacher", "error");
    }
  };

  // Find assigned teacher for class + section + subject
  const getAssignedTeacherId = (section: string, subjectId: string) => {
    const found = teacherAssignments.find(
      (ta) => ta.section === section && ta.subjectId === subjectId
    );
    return found?.teacherId || "";
  };

  // Toggle checkbox in matrix
  const handleMatrixToggle = (studentId: string, subjectId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return;

    setMatrix((prev) => {
      const currentList = prev[studentId] || [];
      const isEnrolled = currentList.includes(subjectId);

      // If compulsory, prevent removal unless intended
      if (!sub.isElective && isEnrolled) {
        toast("Compulsory subjects cannot be deselected", "info");
        return prev;
      }

      const updated = isEnrolled
        ? currentList.filter((id) => id !== subjectId)
        : [...currentList, subjectId];

      return {
        ...prev,
        [studentId]: updated,
      };
    });
  };

  // Save full allocation matrix
  const handleSaveMatrix = async () => {
    if (!selectedClassId) return;
    try {
      setSavingMatrix(true);
      const allocations = Object.entries(matrix).map(([studentId, subjectIds]) => ({
        studentId,
        subjectIds,
      }));

      await api.post("/api/admin/subject-allocation/save-matrix", {
        classId: selectedClassId,
        allocations,
      });

      toast("Student subject allocations saved successfully!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to save allocation matrix", "error");
    } finally {
      setSavingMatrix(false);
    }
  };

  // Reset to default (compulsory for everyone)
  const handleResetToDefaults = () => {
    const compulsoryIds = subjects.filter((s) => !s.isElective).map((s) => s.id);
    const resetMatrix: { [studentId: string]: string[] } = {};
    for (const st of students) {
      resetMatrix[st.id] = [...compulsoryIds];
    }
    setMatrix(resetMatrix);
    toast("Reset matrix to class compulsory defaults", "info");
  };

  // Filter students by section if specified
  const filteredStudents = students.filter((s) => {
    if (selectedSectionFilter === "ALL") return true;
    return s.section === selectedSectionFilter;
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 font-sans">
      {/* Page Header */}
      <div className="neu-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="neu-pill text-indigo-700 bg-indigo-50/80 text-[11px] font-bold">
              Academic Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Subject Allocation &amp; Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Configure compulsory and elective subjects, assign subject teachers, and manage the student enrollment grid.
          </p>
        </div>

        {/* Class Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Selected Class:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="neu-input px-4 py-2 text-xs font-bold text-slate-800 cursor-pointer"
          >
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} ({cls.sections.join(", ")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
          Loading allocation details...
        </div>
      ) : (
        <>
          {/* Card 1: Subjects & Teacher Assignment */}
          <div className="neu-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <div className="neu-circle w-8 h-8 text-indigo-600">
                    <BookOpen size={16} />
                  </div>
                  <span>Subjects &amp; Section Teachers for {currentClass?.name}</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Toggle whether a subject is Compulsory or Elective, and select the teacher assigned to each section.
                </p>
              </div>
              <span className="neu-pill text-indigo-700 bg-indigo-50/80 text-xs font-bold w-fit">
                {subjects.length} Subjects Configured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Requirement</th>
                    {currentClass?.sections.map((sec) => (
                      <th key={sec} className="py-3 px-4">
                        Section {sec} Teacher
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{sub.name}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{sub.code}</td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSubjectType(sub)}
                          className={`neu-pill text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                            sub.isElective
                              ? "text-amber-800 bg-amber-50 hover:bg-amber-100"
                              : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                          title="Click to toggle Compulsory / Elective"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sub.isElective ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>{sub.isElective ? "Elective" : "Compulsory"}</span>
                        </button>
                      </td>

                      {/* Teacher Selector per Section */}
                      {currentClass?.sections.map((sec) => {
                        const currentTeacherId = getAssignedTeacherId(sec, sub.id);
                        return (
                          <td key={sec} className="py-3.5 px-4">
                            <select
                              value={currentTeacherId}
                              onChange={(e) =>
                                handleAssignTeacher(sec, sub.id, e.target.value)
                              }
                              className="neu-input text-xs px-2.5 py-1.5 font-semibold text-slate-700 cursor-pointer"
                            >
                              <option value="">-- Unassigned --</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={3 + (currentClass?.sections.length || 0)} className="py-6 text-center text-slate-400 font-medium">
                        No subjects associated with this class yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Student-by-Subject Allocation Matrix */}
          <div className="neu-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/80">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <div className="neu-circle w-8 h-8 text-indigo-600">
                    <Users size={16} />
                  </div>
                  <span>Student Subject Enrollment Matrix</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Select which subjects each student is enrolled in. Compulsory subjects default on; electives can be tailored individually.
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Section Filter */}
                <div className="neu-card-sm flex items-center gap-1.5 text-xs text-slate-600 px-3 py-1.5">
                  <Filter size={13} className="text-slate-400" />
                  <span className="font-bold">Section:</span>
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="font-bold bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Sections</option>
                    {currentClass?.sections.map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Defaults */}
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-slate-900"
                >
                  <RotateCcw size={13} />
                  <span>Reset Defaults</span>
                </button>

                {/* Save Matrix Button */}
                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix}
                  className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingMatrix ? "Saving Matrix..." : "Save Matrix"}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-16">Roll</th>
                    <th className="py-3 px-4 min-w-[180px]">Student Name</th>
                    <th className="py-3 px-4 w-20">Sec</th>
                    {subjects.map((sub) => (
                      <th
                        key={sub.id}
                        className={`py-3 px-3 text-center whitespace-nowrap ${
                          sub.isElective ? "bg-amber-50/40 rounded-xl" : ""
                        }`}
                      >
                        <div className="font-extrabold text-slate-800">{sub.name}</div>
                        <span
                          className={`neu-pill text-[9px] font-bold px-2 py-0.5 mt-0.5 inline-block ${
                            sub.isElective
                              ? "text-amber-800 bg-amber-100/70"
                              : "text-emerald-800 bg-emerald-100/70"
                          }`}
                        >
                          {sub.isElective ? "Elective" : "Compulsory"}
                        </span>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {filteredStudents.map((st) => {
                    const enrolled = matrix[st.id] || [];
                    return (
                      <tr key={st.id} className="hover:bg-white/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {st.rollNumber || "-"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          <div>{st.name}</div>
                          <div className="text-[11px] font-normal text-slate-400">{st.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-600">
                          {st.section}
                        </td>

                        {/* Subject Checkboxes */}
                        {subjects.map((sub) => {
                          const isChecked = enrolled.includes(sub.id);
                          return (
                            <td
                              key={sub.id}
                              className={`py-3.5 px-3 text-center ${
                                sub.isElective ? "bg-amber-50/20" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMatrixToggle(st.id, sub.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                title={
                                  !sub.isElective
                                    ? "Compulsory for this class"
                                    : "Toggle elective for this student"
                                }
                              />
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          <span className="neu-pill text-xs font-bold text-indigo-700 bg-indigo-50">
                            {enrolled.length} / {subjects.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4 + subjects.length} className="py-8 text-center text-slate-400 font-medium">
                        No students found matching this criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
