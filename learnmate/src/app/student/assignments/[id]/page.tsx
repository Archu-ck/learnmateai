"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  UploadCloud,
  Send,
  Save,
  Award,
  AlertCircle,
  Sparkles,
  Bot,
  User,
} from "lucide-react";

interface AssignmentDetailData {
  assignment: {
    id: string;
    title: string;
    subject: { id: string; name: string; code: string };
    teacherName: string;
    description: string;
    attachments: Array<{ name: string; url: string; size: number }>;
    dueDate: string;
    totalMarks: number;
    estimatedMinutes: number;
    aiHelpLevel: "None" | "Hints only" | "Full";
    resubmissionAllowed: boolean;
    latePolicy: string;
    rubric: Array<{ criterion: string; maxMarks: number; description: string }>;
  };
  submission: {
    id: string;
    textContent: string;
    files: Array<{ name: string; url: string }>;
    status: string;
    marksAwarded: number | null;
    feedback: string;
    rubricScores: Array<{ criterion: string; score: number; maxMarks: number; comment: string }>;
    submittedAt: string;
    gradedAt: string;
  } | null;
}

export default function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;

  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<AssignmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Form State
  const [textContent, setTextContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  // Load Assignment Detail
  const loadDetail = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const res = await api.get<AssignmentDetailData>(
        `/api/student/assignments/${assignmentId}`
      );
      setData(res);
      if (res.submission) {
        setTextContent(res.submission.textContent || "");
        setUploadedFiles(res.submission.files || []);
      }
    } catch (err: any) {
      if (err.status === 403) {
        setForbidden(true);
      } else {
        toast(err.message || "Failed to load assignment", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [assignmentId]);

  // Handle Save Draft or Submit
  const handleSaveOrSubmit = async (isDraft = false) => {
    try {
      if (isDraft) setIsDrafting(true);
      else setSubmitting(true);

      const payload = {
        textContent,
        files: uploadedFiles,
        status: isDraft ? "draft" : "submitted",
      };

      const res = await api.post<{ message: string; submission: any }>(
        `/api/student/assignments/${assignmentId}/submit`,
        payload
      );

      toast(
        isDraft ? "Draft saved successfully" : "Assignment submitted successfully!",
        "success"
      );
      loadDetail();
    } catch (err: any) {
      toast(err.message || "Failed to submit assignment", "error");
    } finally {
      setIsDrafting(false);
      setSubmitting(false);
    }
  };

  // Mock File Upload Simulator
  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mockFile = {
        name: file.name,
        url: URL.createObjectURL(file),
      };
      setUploadedFiles((prev) => [...prev, mockFile]);
      toast(`Attached file: ${file.name}`, "info");
    }
  };

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 neu-card text-center space-y-4 font-sans">
        <div className="neu-circle w-14 h-14 mx-auto text-rose-500">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Access Denied (403)</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
          You are not enrolled in this subject. Under school security rules, students can only access assignments for enrolled subjects.
        </p>
        <Link
          href="/student/assignments"
          className="neu-btn px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 inline-flex items-center gap-2 hover:text-indigo-600"
        >
          <ChevronLeft size={14} />
          <span>Return to Assignments</span>
        </Link>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 text-center text-slate-400 font-medium text-xs font-sans">
        Loading assignment details...
      </div>
    );
  }

  const { assignment, submission } = data;
  const isGraded = submission?.status === "graded";
  const isSubmitted = submission?.status === "submitted";
  const canEdit = !isGraded || assignment.resubmissionAllowed;

  return (
    <div className="max-w-4xl mx-auto my-6 space-y-7 pb-20 font-sans">
      {/* Back Link */}
      <div>
        <Link
          href="/student/assignments"
          className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 hover:text-indigo-600"
        >
          <ChevronLeft size={14} />
          <span>Back to Assignments</span>
        </Link>
      </div>

      {/* Assignment Header Card */}
      <div className="neu-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="neu-pill font-mono font-bold text-[10px] text-indigo-700 bg-indigo-50/80 uppercase">
                {assignment.subject.name}
              </span>
              <span className="neu-pill text-[10px] font-bold text-slate-700 bg-white/70">
                AI Help: {assignment.aiHelpLevel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <User size={14} className="text-slate-400" />
              <span>Teacher:</span>
              <strong className="text-slate-700">{assignment.teacherName}</strong>
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Marks
            </span>
            <span className="text-3xl font-black text-slate-800">{assignment.totalMarks}</span>
          </div>
        </div>

        {/* Timing and Policy Details */}
        <div className="neu-inset grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-2xl text-xs">
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 text-[11px]">Due Date:</span>
            <span className="font-extrabold text-slate-700">
              {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 text-[11px]">Est. Time:</span>
            <span className="font-extrabold text-slate-700">
              {assignment.estimatedMinutes} Mins
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 text-[11px]">Late Submissions:</span>
            <span className="font-extrabold text-slate-700 capitalize">
              {assignment.latePolicy.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block mb-0.5 text-[11px]">Resubmissions:</span>
            <span className="font-extrabold text-slate-700">
              {assignment.resubmissionAllowed ? "Allowed" : "Single Submission"}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Instructions</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium">
            {assignment.description || "Complete the problem set and submit your work."}
          </p>
        </div>

        {/* Rubric Table if defined */}
        {assignment.rubric?.length > 0 && (
          <div className="pt-2 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Evaluation Rubric</h3>
            <div className="overflow-x-auto neu-inset rounded-2xl p-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Criterion</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Max Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {assignment.rubric.map((r, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{r.criterion}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium">{r.description}</td>
                      <td className="py-2.5 px-3 text-right font-black text-indigo-700">{r.maxMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Teacher Grade & Feedback Card (if graded) */}
      {isGraded && (
        <div className="neu-card p-6 sm:p-7 space-y-4 border border-emerald-200/60">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <div className="neu-circle w-8 h-8 text-emerald-600">
                <Award size={16} />
              </div>
              <span>Teacher Grade &amp; Feedback</span>
            </h2>
            <span className="neu-pill text-emerald-700 bg-emerald-50 text-sm font-black px-3.5 py-1">
              {submission?.marksAwarded} / {assignment.totalMarks} Marks
            </span>
          </div>

          <div className="neu-inset p-4 rounded-2xl text-xs text-slate-700 space-y-1.5 font-medium">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Teacher Comments:</span>
            <p className="leading-relaxed whitespace-pre-line">
              {submission?.feedback || "Well done! Good step-by-step problem solving."}
            </p>
          </div>
        </div>
      )}

      {/* Submission Portal Card */}
      <div className="neu-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-white/80 pb-3">
          <h2 className="text-base font-extrabold text-slate-800">Your Submission</h2>
          {submission?.status && (
            <span className="neu-pill text-[11px] font-bold capitalize text-indigo-700 bg-indigo-50/80">
              Status: {submission.status.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Text Submission Box */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Written Answer / Working Steps
          </label>
          <textarea
            rows={5}
            disabled={!canEdit}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Type your answer, calculations, or explanations here..."
            className="neu-input w-full p-4 text-xs font-medium disabled:opacity-60"
          />
        </div>

        {/* File Attachments */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Upload Work (PDF, Images, Documents)
          </label>

          {canEdit && (
            <div className="flex items-center gap-3">
              <label className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 inline-flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                <UploadCloud size={16} className="text-indigo-600" />
                <span>Attach File</span>
                <input
                  type="file"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400 font-medium">PDF, PNG, JPG up to 10MB</span>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {uploadedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="neu-card-sm px-3.5 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-2"
                >
                  <FileText size={14} className="text-indigo-600" />
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/80">
            <button
              type="button"
              disabled={isDrafting}
              onClick={() => handleSaveOrSubmit(true)}
              className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Save size={15} />
              <span>{isDrafting ? "Saving Draft..." : "Save Draft"}</span>
            </button>

            <button
              type="button"
              disabled={submitting || !textContent.trim()}
              onClick={() => handleSaveOrSubmit(false)}
              className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={15} />
              <span>
                {submitting
                  ? "Submitting..."
                  : isGraded
                  ? "Resubmit Assignment"
                  : "Submit Assignment"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
