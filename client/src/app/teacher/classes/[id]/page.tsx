"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import AiTestBuilderModal from "@/components/AiTestBuilderModal";
import TeacherTestAnalyticsModal from "@/components/TeacherTestAnalyticsModal";
import {
  Users,
  FileText,
  CheckSquare,
  BookOpen,
  ClipboardList,
  Calendar,
  MessageSquare,
  BarChart3,
  Plus,
  Download,
  AlertTriangle,
  Bot,
  ChevronRight,
  ChevronLeft,
  X,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
} from "lucide-react";

interface WorkspaceDetail {
  workspace: {
    id: string;
    className: string;
    section: string;
    classId: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    isElective: boolean;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    averageGrade: number;
    status: "On Track" | "Needs Attention" | "At Risk";
    submissionCount: number;
  }>;
  assignments: Array<any>;
  tests: Array<any>;
  lessons: Array<any>;
  topics: Array<{ id: string; name: string }>;
  gradeRecords: Array<any>;
}

export default function ClassWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;

  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "students" | "assignments" | "tests" | "lessons" | "gradebook" | "attendance" | "chat" | "analytics"
  >("students");

  const [data, setData] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Student Profile & AI Doubt Summary State
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [doubtSummary, setDoubtSummary] = useState<any | null>(null);
  const [loadingDoubtSummary, setLoadingDoubtSummary] = useState(false);
  const [readOnlyConv, setReadOnlyConv] = useState<any | null>(null);
  const [readOnlyMessages, setReadOnlyMessages] = useState<any[]>([]);

  const handleOpenStudentProfile = async (student: any) => {
    setSelectedStudent(student);
    setDoubtSummary(null);
    setReadOnlyConv(null);
    if (!data) return;
    try {
      setLoadingDoubtSummary(true);
      const res = await api.get<any>(
        `/api/ai/doubt/teacher-summary?studentId=${student.id}&subjectId=${data.workspace.subjectId}`
      );
      setDoubtSummary(res);
    } catch (err: any) {
      console.warn("Could not fetch doubt summary:", err.message);
    } finally {
      setLoadingDoubtSummary(false);
    }
  };

  const handleOpenReadOnlyConv = async (convId: string) => {
    try {
      const res = await api.get<any>(`/api/ai/doubt/conversations/${convId}/messages`);
      setReadOnlyConv(res.conversation);
      setReadOnlyMessages(res.messages || []);
    } catch (err: any) {
      toast(err.message || "Failed to load discussion", "error");
    }
  };

  // Assignment Creation Modal State
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    topicId: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
    totalMarks: 50,
    estimatedMinutes: 45,
    aiHelpLevel: "Hints only",
    latePolicy: "allowed",
    resubmissionAllowed: true,
  });
  const [workloadWarning, setWorkloadWarning] = useState<string | null>(null);
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Submissions & Grading Drawer State
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [currentGradingIndex, setCurrentGradingIndex] = useState<number>(0);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingMarks, setGradingMarks] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState<string>("");

  // Test Builder Modal State
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showAiTestBuilder, setShowAiTestBuilder] = useState(false);
  const [selectedAnalyticsTestId, setSelectedAnalyticsTestId] = useState<string | null>(null);
  const [isGeneratingAiTest, setIsGeneratingAiTest] = useState(false);
  const [testForm, setTestForm] = useState({
    title: "",
    durationMinutes: 30,
    totalMarks: 20,
    startWindow: new Date().toISOString().split("T")[0],
    endWindow: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
    questions: [
      {
        type: "mcq",
        text: "What is the slope of the line represented by y = 3x + 5?",
        options: ["3", "5", "1/3", "-3"],
        answer: "3",
        marks: 2,
      },
    ],
  });

  // Lesson Creation Modal State
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    topicId: "",
    title: "",
    content: "",
    status: "published",
  });

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [studentId: string]: "present" | "absent" | "late" | "leave";
  }>({});

  // Load Workspace Data
  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const res = await api.get<WorkspaceDetail>(`/api/teacher/classes/${assignmentId}`);
      setData(res);

      const initialAttendance: any = {};
      for (const st of res.students || []) {
        initialAttendance[st.id] = "present";
      }
      setAttendanceRecords(initialAttendance);
    } catch (err: any) {
      toast(err.message || "Failed to load class workspace", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [assignmentId]);

  // Check workload when due date changes
  const checkWorkload = async (date: string) => {
    if (!data) return;
    try {
      const res = await api.get<{
        totalHours: number;
        isOverloaded: boolean;
      }>(
        `/api/teacher/workload?classId=${data.workspace.classId}&section=${data.workspace.section}&date=${date}`
      );
      if (res.isOverloaded) {
        setWorkloadWarning(
          `Notice: Class has ${res.totalHours} hrs of homework due on this date. Consider scheduling earlier or later.`
        );
      } else {
        setWorkloadWarning(null);
      }
    } catch (e) {
      // Ignore background check failure
    }
  };

  // AI Effort Estimate (Skeleton)
  const handleAiEstimateEffort = async () => {
    try {
      setIsAiEstimating(true);
      const res = await api.post<any>("/api/ai/estimate-effort", {
        title: assignmentForm.title,
        description: assignmentForm.description,
      });
      setAssignmentForm((prev) => ({
        ...prev,
        estimatedMinutes: res.estimatedMinutes || 45,
      }));
      toast(`AI Estimated: ${res.estimatedMinutes} minutes (${res.reasoning})`, "success");
    } catch (err: any) {
      toast(err.message || "Failed to get AI estimate", "error");
    } finally {
      setIsAiEstimating(false);
    }
  };

  // AI Draft Assignment (Skeleton)
  const handleAiDraftAssignment = async () => {
    if (!data) return;
    try {
      setIsAiDrafting(true);
      const res = await api.post<any>("/api/ai/draft-assignment", {
        topic: data.workspace.subjectName,
        level: `${data.workspace.className} - Sec ${data.workspace.section}`,
      });
      setAssignmentForm((prev) => ({
        ...prev,
        title: res.title || prev.title,
        description: res.description || prev.description,
        estimatedMinutes: res.estimatedMinutes || prev.estimatedMinutes,
      }));
      toast("Drafted assignment content using AI!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to draft assignment with AI", "error");
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Create Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      const validTopicId =
        assignmentForm.topicId && assignmentForm.topicId.length === 24
          ? assignmentForm.topicId
          : undefined;

      await api.post("/api/teacher/assignments", {
        ...assignmentForm,
        topicId: validTopicId,
        classId: data.workspace.classId,
        section: data.workspace.section,
        subjectId: data.workspace.subjectId,
      });
      toast("Assignment created and published!", "success");
      setShowCreateAssignment(false);
      loadWorkspace();
    } catch (err: any) {
      toast(err.message || "Failed to create assignment", "error");
    }
  };

  // Open Submissions Table
  const handleOpenSubmissions = async (id: string) => {
    try {
      const res = await api.get<{ submissions: any[] }>(
        `/api/teacher/assignments/${id}/submissions`
      );
      setActiveAssignmentId(id);
      setSubmissionsList(res.submissions || []);
      setCurrentGradingIndex(0);
      if (res.submissions?.length > 0) {
        setGradingMarks(res.submissions[0].marksAwarded || 0);
        setGradingFeedback(res.submissions[0].feedback || "");
      }
      setShowGradingModal(true);
    } catch (err: any) {
      toast(err.message || "Failed to load submissions", "error");
    }
  };

  // Save Grade
  const handleSaveGrade = async (returnForRevision = false) => {
    const currentSub = submissionsList[currentGradingIndex];
    if (!currentSub || !activeAssignmentId) return;

    try {
      await api.post(`/api/teacher/submissions/${currentSub.submissionId || activeAssignmentId}/grade`, {
        studentId: currentSub.studentId,
        marksAwarded: gradingMarks,
        feedback: gradingFeedback,
        status: returnForRevision ? "revision_requested" : "graded",
      });

      toast(
        returnForRevision ? "Returned for student revision" : "Grade published successfully!",
        "success"
      );

      const updated = [...submissionsList];
      updated[currentGradingIndex] = {
        ...updated[currentGradingIndex],
        marksAwarded: gradingMarks,
        feedback: gradingFeedback,
        status: returnForRevision ? "revision_requested" : "graded",
      };
      setSubmissionsList(updated);

      if (currentGradingIndex < submissionsList.length - 1) {
        const nextIdx = currentGradingIndex + 1;
        setCurrentGradingIndex(nextIdx);
        setGradingMarks(updated[nextIdx].marksAwarded || 0);
        setGradingFeedback(updated[nextIdx].feedback || "");
      }
    } catch (err: any) {
      toast(err.message || "Failed to save grade", "error");
    }
  };

  // Generate Test with AI
  const handleAiGenerateTest = async () => {
    if (!data) return;
    try {
      setIsGeneratingAiTest(true);
      const res = await api.post<any>("/api/ai/generate-test", {
        topic: data.workspace.subjectName,
        difficulty: "medium",
        count: 3,
      });
      if (res.generatedQuestions && res.generatedQuestions.length > 0) {
        setTestForm((prev) => ({
          ...prev,
          title: `${data.workspace.subjectName} Mid-Term Assessment`,
          totalMarks: res.generatedQuestions.reduce((sum: number, q: any) => sum + (q.marks || 2), 0),
          questions: res.generatedQuestions,
        }));
        toast(`Generated ${res.generatedQuestions.length} questions with AI!`, "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to generate test with AI", "error");
    } finally {
      setIsGeneratingAiTest(false);
    }
  };

  // Create Test
  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      await api.post("/api/teacher/tests", {
        ...testForm,
        classId: data.workspace.classId,
        section: data.workspace.section,
        subjectId: data.workspace.subjectId,
      });
      toast("Test published successfully!", "success");
      setShowCreateTest(false);
      loadWorkspace();
    } catch (err: any) {
      toast(err.message || "Failed to create test", "error");
    }
  };

  // Create Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      const validTopicId =
        lessonForm.topicId && lessonForm.topicId.length === 24
          ? lessonForm.topicId
          : undefined;

      await api.post("/api/teacher/lessons", {
        ...lessonForm,
        topicId: validTopicId,
        subjectId: data.workspace.subjectId,
      });
      toast("Lesson published to student portal!", "success");
      setShowCreateLesson(false);
      loadWorkspace();
    } catch (err: any) {
      toast(err.message || "Failed to post lesson", "error");
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!data) return;
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      await api.post("/api/teacher/attendance", {
        classId: data.workspace.classId,
        section: data.workspace.section,
        date: attendanceDate,
        records,
      });
      toast("Attendance recorded for " + attendanceDate, "success");
    } catch (err: any) {
      toast(err.message || "Failed to save attendance", "error");
    }
  };

  // Export Gradebook to CSV
  const handleExportGradebookCSV = () => {
    if (!data) return;
    const headers = ["Roll Number", "Student Name", "Average Grade (%)", "Status"];
    const rows = data.students.map((st) => [
      st.rollNumber,
      `"${st.name}"`,
      st.averageGrade,
      st.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Gradebook_${data.workspace.className}_${data.workspace.section}_${data.workspace.subjectCode}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        <div className="h-28 neu-card animate-pulse rounded-3xl" />
        <div className="h-96 neu-card animate-pulse rounded-3xl" />
      </div>
    );
  }

  const { workspace, students, assignments, tests, lessons, topics } = data;

  const tabs = [
    { key: "students", label: "Students", icon: Users },
    { key: "assignments", label: "Assignments", icon: FileText },
    { key: "tests", label: "Tests & Quizzes", icon: CheckSquare },
    { key: "lessons", label: "Lessons & Resources", icon: BookOpen },
    { key: "gradebook", label: "Gradebook", icon: ClipboardList },
    { key: "attendance", label: "Attendance", icon: Calendar },
    { key: "chat", label: "Class Chat", icon: MessageSquare },
    { key: "analytics", label: "Class Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 font-sans">
      {/* Workspace Header Card */}
      <div className="neu-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="neu-pill text-indigo-700 bg-indigo-50/80 font-mono text-[11px] font-bold">
              {workspace.subjectCode}
            </span>
            <span className="neu-pill text-slate-700 bg-white/70 text-[11px] font-bold">
              {workspace.className} - Section {workspace.section}
            </span>
            {workspace.isElective && (
              <span className="neu-pill text-amber-700 bg-amber-50/80 text-[11px] font-bold">
                Elective Course
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {workspace.subjectName} Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Enrolled Students: <strong className="text-slate-700">{students.length}</strong> • Active Assignments:{" "}
            <strong className="text-slate-700">{assignments.length}</strong> • Tests:{" "}
            <strong className="text-slate-700">{tests.length}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowCreateAssignment(true)}
            className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <Plus size={15} />
            <span>New Assignment</span>
          </button>
          <button
            onClick={() => setShowCreateTest(true)}
            className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:text-indigo-600"
          >
            <CheckSquare size={15} />
            <span>New Test</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Capsule (Fully Reactive, Auto-Fills Rows on Any Screen Size) */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 min-w-[110px] sm:min-w-[125px] flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "neu-btn-primary text-white shadow-md shadow-indigo-500/25"
                  : "neu-btn text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={14} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STUDENTS */}
      {activeTab === "students" && (
        <div className="neu-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
            <h2 className="text-base font-extrabold text-slate-800">
              Enrolled Student Roster ({students.length})
            </h2>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="neu-pill text-emerald-700 bg-emerald-50/70 text-[11px] font-bold inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> On Track
              </span>
              <span className="neu-pill text-amber-700 bg-amber-50/70 text-[11px] font-bold inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Needs Attention
              </span>
              <span className="neu-pill text-rose-700 bg-rose-50/70 text-[11px] font-bold inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> At Risk
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-16">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Avg Grade</th>
                  <th className="py-3 px-4 text-center">Submissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      {st.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{st.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{st.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`neu-pill text-[10px] font-bold inline-flex items-center gap-1.5 ${
                          st.status === "On Track"
                            ? "text-emerald-700 bg-emerald-50"
                            : st.status === "Needs Attention"
                            ? "text-amber-700 bg-amber-50"
                            : "text-rose-700 bg-rose-50"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.status === "On Track"
                              ? "bg-emerald-500"
                              : st.status === "Needs Attention"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                      {st.averageGrade}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                      {st.submissionCount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentProfile(st)}
                        className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          {assignments.map((ass) => (
            <div
              key={ass.id}
              className="neu-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-800">{ass.title}</h3>
                  <span className="neu-pill text-indigo-700 bg-indigo-50/70 text-[10px] font-bold">
                    AI Help: {ass.aiHelpLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 font-medium">{ass.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold pt-1">
                  <span>Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Marks: {ass.totalMarks}</span>
                  <span>•</span>
                  <span>Est. {ass.estimatedMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="neu-inset px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 rounded-xl">
                  <span className="text-emerald-700">{ass.stats?.submitted || 0} submitted</span>
                  <span>•</span>
                  <span className="text-indigo-700">{ass.stats?.graded || 0} graded</span>
                  <span>•</span>
                  <span className="text-slate-400">{ass.stats?.pending || 0} pending</span>
                </div>

                <button
                  onClick={() => handleOpenSubmissions(ass.id)}
                  className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
                >
                  Submissions & Grade
                </button>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
              No assignments posted yet. Click "New Assignment" to publish coursework.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TESTS */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowAiTestBuilder(true)}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-1.5 hover:text-indigo-900"
            >
              <Sparkles size={14} className="text-indigo-600" />
              <span>AI Test Builder</span>
            </button>
            <button
              onClick={() => setShowCreateTest(true)}
              className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Create New Test</span>
            </button>
          </div>

          {tests.map((t) => (
            <div
              key={t.id}
              className="neu-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-800">{t.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
                  <span>Duration: {t.durationMinutes} mins</span>
                  <span>•</span>
                  <span>Total Marks: {t.totalMarks}</span>
                  <span>•</span>
                  <span>Window: {new Date(t.startWindow).toLocaleDateString()} - {new Date(t.endWindow).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedAnalyticsTestId(t.id)}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-1.5 hover:text-indigo-900 cursor-pointer"
                >
                  <BarChart3 size={13} />
                  <span>View Analytics</span>
                </button>
                <span className="neu-pill text-emerald-700 bg-emerald-50 text-xs font-bold">
                  Published &amp; Active
                </span>
              </div>
            </div>
          ))}
          {tests.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
              No tests created for this class yet. Click "Create New Test" or use the AI test builder.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LESSONS & RESOURCES */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateLesson(true)}
              className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Upload Lesson / Resource</span>
            </button>
          </div>

          {lessons.map((lesson) => (
            <div key={lesson.id} className="neu-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-800">{lesson.title}</h3>
                <span className="neu-pill text-slate-500 text-[11px] font-bold">
                  Topic: {lesson.topicId?.name || "General"}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                {lesson.content}
              </p>
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="neu-card p-12 text-center text-slate-400 font-medium text-xs">
              No lessons uploaded yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GRADEBOOK */}
      {activeTab === "gradebook" && (
        <div className="neu-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/80">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Class Gradebook</h2>
              <p className="text-xs text-slate-400 font-medium">
                Composite assessment marks with weights and totals.
              </p>
            </div>

            <button
              onClick={handleExportGradebookCSV}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:text-indigo-600"
            >
              <Download size={14} />
              <span>Export to CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-16">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Linear Equations Assignment (100)</th>
                  <th className="py-3 px-4 text-center">Unit 1 Mid-Term (20)</th>
                  <th className="py-3 px-4 text-center font-extrabold text-slate-800">Total Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{st.rollNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{st.name}</td>
                    <td className="py-3.5 px-4 text-center font-semibold">{st.averageGrade}</td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {Math.round((st.averageGrade / 100) * 20)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-indigo-700">
                      {st.averageGrade}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="neu-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/80">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Mark Class Attendance</h2>
              <p className="text-xs text-slate-400 font-medium">Record daily or period-level presence.</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="neu-input px-3 py-1.5 text-xs font-semibold"
              />
              <button
                onClick={handleSaveAttendance}
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
              >
                Save Attendance
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-16">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {students.map((st) => {
                  const currentStatus = attendanceRecords[st.id] || "present";
                  return (
                    <tr key={st.id} className="hover:bg-white/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{st.rollNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{st.name}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="neu-inset p-1 inline-flex rounded-xl gap-1 text-[11px] font-bold">
                          {(["present", "absent", "late", "leave"] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setAttendanceRecords((prev) => ({ ...prev, [st.id]: s }))
                              }
                              className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                                currentStatus === s
                                  ? s === "present"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : s === "absent"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-amber-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: CHAT SHORTCUT */}
      {activeTab === "chat" && (
        <div className="neu-card p-12 text-center space-y-4">
          <div className="neu-circle w-16 h-16 mx-auto text-indigo-600">
            <MessageSquare size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Teacher Chat Inbox</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
            Manage student conversations and resolve doubts for this class in your unified Teacher Chat Inbox.
          </p>
          <Link
            href="/teacher/chat"
            className="neu-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            <span>Open Unified Chat Inbox</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* TAB 8: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="neu-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">Performance Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>90% - 100% (High Achievers)</span>
                  <span>4 students</span>
                </div>
                <div className="neu-inset h-3 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "33%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>70% - 89% (On Track)</span>
                  <span>6 students</span>
                </div>
                <div className="neu-inset h-3 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "50%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Below 70% (Attention Needed)</span>
                  <span>2 students</span>
                </div>
                <div className="neu-inset h-3 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "17%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="neu-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-800">
              Top 3 Concepts Needing Revision
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 neu-card-sm text-xs space-y-1">
                <span className="font-extrabold text-amber-800 block">
                  1. Graphing Linear Equations
                </span>
                <span className="text-slate-500 font-medium leading-relaxed block">
                  42% of students missed coordinate mapping questions on Unit 1 test.
                </span>
              </div>
              <div className="p-3.5 neu-card-sm text-xs space-y-1">
                <span className="font-extrabold text-slate-700 block">
                  2. Elimination Method for Simultaneous Systems
                </span>
                <span className="text-slate-500 font-medium leading-relaxed block">
                  65% average score on multi-step algebraic problems.
                </span>
              </div>
              <div className="p-3.5 neu-card-sm text-xs space-y-1">
                <span className="font-extrabold text-slate-700 block">
                  3. Word Problems & Variable Setup
                </span>
                <span className="text-slate-500 font-medium leading-relaxed block">
                  Frequent questions flagged as Doubts in teacher chat.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ASSIGNMENT */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="neu-card max-w-2xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="neu-circle w-9 h-9 text-indigo-600">
                  <FileText size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">Create New Assignment</h3>
              </div>
              <button
                onClick={() => setShowCreateAssignment(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAiDraftAssignment}
                disabled={isAiDrafting}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:text-indigo-700"
              >
                <Sparkles size={13} />
                <span>{isAiDrafting ? "Drafting..." : "Draft with AI Assistant"}</span>
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, title: e.target.value })
                  }
                  className="neu-input w-full px-3.5 py-2 text-xs font-semibold"
                  placeholder="e.g. Linear Equations Homework 3"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, description: e.target.value })
                  }
                  className="neu-input w-full px-3.5 py-2 text-xs"
                  placeholder="Enter details and instructions for students..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignmentForm.dueDate}
                    onChange={(e) => {
                      setAssignmentForm({ ...assignmentForm, dueDate: e.target.value });
                      checkWorkload(e.target.value);
                    }}
                    className="neu-input w-full px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={assignmentForm.totalMarks}
                    onChange={(e) =>
                      setAssignmentForm({ ...assignmentForm, totalMarks: Number(e.target.value) })
                    }
                    className="neu-input w-full px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Est. Minutes
                    </label>
                    <button
                      type="button"
                      onClick={handleAiEstimateEffort}
                      disabled={isAiEstimating}
                      className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Bot size={11} />
                      {isAiEstimating ? "..." : "AI Estimate"}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={assignmentForm.estimatedMinutes}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        estimatedMinutes: Number(e.target.value),
                      })
                    }
                    className="neu-input w-full px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              {workloadWarning && (
                <div className="neu-card-sm p-3 border-amber-300 bg-amber-50/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>{workloadWarning}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  AI Help Setting for Students
                </label>
                <select
                  value={assignmentForm.aiHelpLevel}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, aiHelpLevel: e.target.value })
                  }
                  className="neu-input w-full px-3 py-2 text-xs font-bold"
                >
                  <option value="None">None (Closed book, no AI assistance)</option>
                  <option value="Hints only">Hints only (Socratic questions & concept reminders)</option>
                  <option value="Full">Full (AI tutoring and full explanations allowed)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignment(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI TEST BUILDER & REVIEW WIZARD */}
      {showCreateTest && (
        <AiTestBuilderModal
          classId={data.workspace.classId}
          className={data.workspace.className}
          subjectId={data.workspace.subjectId}
          subjectName={data.workspace.subjectName}
          topics={topics}
          sections={[data.workspace.section, "A", "B"].filter((v, i, a) => a.indexOf(v) === i)}
          onClose={() => setShowCreateTest(false)}
          onTestPublished={() => {
            loadWorkspace();
          }}
        />
      )}

      {/* MODAL: CREATE LESSON */}
      {showCreateLesson && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="neu-card max-w-lg w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-white/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="neu-circle w-9 h-9 text-indigo-600">
                  <BookOpen size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">Upload Lesson Resource</h3>
              </div>
              <button
                onClick={() => setShowCreateLesson(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="neu-input w-full px-3.5 py-2 text-xs font-semibold"
                  placeholder="e.g. Chapter 4 - Graphical Solutions"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Content / Summary / Resources
                </label>
                <textarea
                  rows={4}
                  required
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="neu-input w-full px-3.5 py-2 text-xs"
                  placeholder="Paste lecture notes, study summary or links..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/80">
                <button
                  type="button"
                  onClick={() => setShowCreateLesson(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Post Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMISSIONS & GRADING DRAWER */}
      {showGradingModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="neu-card max-w-3xl w-full p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/80 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Submissions &amp; Grading Drawer
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Student {currentGradingIndex + 1} of {submissionsList.length}
                </p>
              </div>
              <button
                onClick={() => setShowGradingModal(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {submissionsList[currentGradingIndex] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between neu-card-sm p-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      {submissionsList[currentGradingIndex].studentName}
                    </h4>
                    <span className="text-xs text-slate-400 font-semibold">
                      Roll No: {submissionsList[currentGradingIndex].rollNumber}
                    </span>
                  </div>
                  <span className="neu-pill text-xs font-bold capitalize text-indigo-700 bg-indigo-50">
                    {submissionsList[currentGradingIndex].status}
                  </span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student Submission Text:
                  </h5>
                  <div className="neu-inset p-3.5 text-xs text-slate-700 min-h-[90px] rounded-xl font-medium">
                    {submissionsList[currentGradingIndex].textContent || (
                      <span className="italic text-slate-400">
                        No written text submitted.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Awarded Marks
                    </label>
                    <input
                      type="number"
                      value={gradingMarks}
                      onChange={(e) => setGradingMarks(Number(e.target.value))}
                      className="neu-input w-full px-3 py-2 text-xs font-black text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Teacher Feedback
                    </label>
                    <textarea
                      rows={2}
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="Add specific comments..."
                      className="neu-input w-full px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/80 flex-wrap gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentGradingIndex === 0}
                      onClick={() => {
                        const prevIdx = currentGradingIndex - 1;
                        setCurrentGradingIndex(prevIdx);
                        setGradingMarks(submissionsList[prevIdx].marksAwarded || 0);
                        setGradingFeedback(submissionsList[prevIdx].feedback || "");
                      }}
                      className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                      type="button"
                      disabled={currentGradingIndex === submissionsList.length - 1}
                      onClick={() => {
                        const nextIdx = currentGradingIndex + 1;
                        setCurrentGradingIndex(nextIdx);
                        setGradingMarks(submissionsList[nextIdx].marksAwarded || 0);
                        setGradingFeedback(submissionsList[nextIdx].feedback || "");
                      }}
                      className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveGrade(true)}
                      className="neu-btn px-3.5 py-2 text-amber-700 hover:text-amber-800 rounded-xl text-xs font-bold"
                    >
                      Return for Revision
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveGrade(false)}
                      className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Publish Grade
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: STUDENT PROFILE & AI DOUBT SUMMARY */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="neu-card max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-slim">
            <div className="flex items-center justify-between border-b border-white/80 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">Student Profile & AI Insights</h3>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setReadOnlyConv(null);
                }}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-800">{selectedStudent.name}</h4>
                <p className="text-xs text-slate-400 font-medium">{selectedStudent.email}</p>
                <span className="text-xs font-bold text-slate-600 mt-0.5 block">
                  Roll Number: {selectedStudent.rollNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 neu-inset p-3.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Average Mark
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {selectedStudent.averageGrade}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Academic Status
                  </span>
                  <span className="text-xs font-extrabold text-indigo-700">
                    {selectedStudent.status}
                  </span>
                </div>
              </div>

              {/* AI Doubt Activity Summary */}
              <div className="neu-card-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <Bot size={15} className="text-indigo-600" />
                    <span>AI Doubt Activity ({data.workspace.subjectName})</span>
                  </h5>
                  <span className="neu-pill text-[9px] font-black px-2 py-0.5 text-indigo-700 bg-indigo-50">
                    VidyaAI Summary
                  </span>
                </div>

                {loadingDoubtSummary ? (
                  <div className="text-xs text-slate-400 italic py-2">Loading doubt summary...</div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="neu-inset p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Questions Inquired</span>
                        <span className="text-sm font-black text-slate-800">{doubtSummary?.totalQuestions || 0}</span>
                      </div>
                      <div className="neu-inset p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Hints Requested</span>
                        <span className="text-sm font-black text-indigo-600">{doubtSummary?.hintsUsed || 0}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Topics Inquired</span>
                      <div className="flex flex-wrap gap-1">
                        {doubtSummary?.topicsAsked && doubtSummary.topicsAsked.length > 0 ? (
                          doubtSummary.topicsAsked.map((t: string, idx: number) => (
                            <span key={idx} className="neu-pill px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white/80">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No topics inquired yet</span>
                        )}
                      </div>
                    </div>

                    {/* Discussions List */}
                    {doubtSummary?.conversations && doubtSummary.conversations.length > 0 && (
                      <div className="pt-2 border-t border-white/60 space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          AI Discussions (Read-Only)
                        </span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1 scrollbar-slim">
                          {doubtSummary.conversations.map((c: any) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => handleOpenReadOnlyConv(c._id)}
                              className="w-full text-left p-2 rounded-lg neu-inset text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate max-w-[260px]">{c.title}</span>
                              <span className="text-[10px] text-indigo-600 font-bold">Review &rarr;</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Read-Only Conversation Viewer Drawer */}
              {readOnlyConv && (
                <div className="neu-inset p-3.5 rounded-xl space-y-3 bg-white/70">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-xs font-bold text-slate-800">Reviewing: {readOnlyConv.title}</span>
                    <button
                      onClick={() => setReadOnlyConv(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Close Viewer
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs scrollbar-slim">
                    {readOnlyMessages.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className={`p-2.5 rounded-lg text-xs ${
                          m.role === "user"
                            ? "neu-btn-primary text-white ml-auto max-w-[85%]"
                            : "neu-card text-slate-800 mr-auto max-w-[90%]"
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase opacity-75 block mb-0.5">
                          {m.role === "user" ? "Student" : "VidyaAI"}
                        </span>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/teacher/chat"
                  className="neu-btn-primary w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  <MessageSquare size={14} />
                  <span>Send Direct Message</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Test Analytics Modal */}
      {selectedAnalyticsTestId && (
        <TeacherTestAnalyticsModal
          isOpen={!!selectedAnalyticsTestId}
          onClose={() => setSelectedAnalyticsTestId(null)}
          testId={selectedAnalyticsTestId}
        />
      )}
    </div>
  );
}
