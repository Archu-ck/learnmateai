"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  BarChart3,
  Users,
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  FileText,
  UserCheck,
  Building,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface PrincipalDashboardData {
  principal: {
    id: string;
    name: string;
    email: string;
    institutionName: string;
  };
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    schoolAttendanceRate: number;
    schoolAcademicAverage: number;
    activeAssignmentsCount: number;
  };
  classesOverview: Array<{
    id: string;
    name: string;
    sections: string[];
    studentCount: number;
    classTeacherName: string;
    classTeacherEmail: string;
    attendanceRate: number;
    academicAverage: number;
    status: string;
  }>;
  departmentPerformance: Array<{
    id: string;
    name: string;
    code: string;
    facultyCount: number;
    studentCount: number;
    averageScore: number;
    passingRate: number;
    status: string;
  }>;
  atRiskStudents: Array<{
    id: string;
    name: string;
    className: string;
    section: string;
    attendancePercentage: number;
    averageGrade: number;
    riskFactors: string[];
    status: string;
    recommendedAction: string;
  }>;
  facultyWorkload: Array<{
    id: string;
    name: string;
    email: string;
    classes: string[];
    subjects: string[];
    activeAssignmentsCount: number;
    loadStatus: string;
  }>;
  auditEvents: Array<{
    id: string;
    actorName: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    timestamp: string;
  }>;
  aiBriefing: {
    institutionalHealthStatus: string;
    executiveSummary: string;
    keyAchievements: string[];
    operationalRisks: string[];
    strategicRecommendations: string[];
  } | null;
}

export default function PrincipalDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<PrincipalDashboardData | null>(() =>
    api.getCached<PrincipalDashboardData>("/api/principal/dashboard")
  );
  const [loading, setLoading] = useState<boolean>(() => !api.getCached("/api/principal/dashboard"));
  const [activeTab, setActiveTab] = useState<"classes" | "departments" | "atRisk" | "faculty" | "audit">("classes");

  // On-demand AI Briefing state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [customAIBriefing, setCustomAIBriefing] = useState<any>(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get<PrincipalDashboardData>("/api/principal/dashboard");
      setData(res);
    } catch (err: any) {
      if (!silent) toast(err.message || "Failed to load principal dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCached = !!api.getCached("/api/principal/dashboard");
    loadData(hasCached);
  }, []);

  const handleGenerateAIBriefing = async () => {
    try {
      setGeneratingAI(true);
      const res = await api.post<{ briefing: any }>("/api/principal/ai-briefing", {});
      setCustomAIBriefing(res.briefing);
      toast("Institutional Strategic AI Briefing generated successfully!", "success");
    } catch (err: any) {
      toast(err.message || "Could not generate AI briefing at this time", "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  const principalName = user?.name || data?.principal?.name || "Dr. Ramesh Iyer";
  const overview = data?.overview;
  const briefing = customAIBriefing || data?.aiBriefing;

  return (
    <RoleGuard allowedRoles={["principal", "admin"]}>
      <div className="space-y-7 max-w-7xl mx-auto pb-16 font-sans">
        {/* Executive Leadership Hero Banner */}
        <div className="neu-card p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/25 shrink-0">
              {principalName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200/60 inline-flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Institutional Leadership</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Secondary Wing Session 2026-2027</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Welcome, {principalName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Vidya Bharati Public School • Office of Academic Governance &amp; Institutional Oversight
              </p>
            </div>
          </div>

          {/* Quick Leadership Navigation Pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/admin/classes"
              className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5"
            >
              <ClipboardList size={13} />
              <span>Classes</span>
            </Link>
            <Link
              href="/admin/subject-allocation"
              className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5"
            >
              <BookOpen size={13} />
              <span>Allocation</span>
            </Link>
            <Link
              href="/admin/audit"
              className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5"
            >
              <FileText size={13} />
              <span>Audit Log</span>
            </Link>
          </div>
        </div>

        {/* 5 Core Institutional KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {/* 1. Total Students */}
          <div className="neu-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Enrolled Students
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {overview?.totalStudents || 30}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">100% active roster status</p>
          </div>

          {/* 2. Teaching Faculty */}
          <div className="neu-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Teaching Faculty
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {overview?.totalTeachers || 5}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">100% staffing coverage</p>
          </div>

          {/* 3. Overall Attendance */}
          <div className="neu-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                School Attendance
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Calendar size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {overview?.schoolAttendanceRate ?? 94.2}%
            </div>
            <p className="text-[11px] text-emerald-600 font-bold">Above 90% benchmark</p>
          </div>

          {/* 4. Academic Performance */}
          <div className="neu-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Academic Index
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {overview?.schoolAcademicAverage ?? 85.4}%
            </div>
            <p className="text-[11px] text-amber-600 font-bold">Distinction Tier</p>
          </div>

          {/* 5. Classes & Sections */}
          <div className="neu-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Classes &amp; Subjects
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Building size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {overview?.totalClasses || 1} Cls • {overview?.totalSubjects || 5} Sub
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Curriculum active</p>
          </div>
        </div>

        {/* AI Institutional Strategic Executive Briefing Card */}
        <div className="neu-card p-6 sm:p-7 relative overflow-hidden space-y-5 border border-amber-200/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    Institutional Strategic AI Briefing
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {briefing?.institutionalHealthStatus || "Exemplary • Green Tier"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Automated executive intelligence synthesized for School Board &amp; Principal review.
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateAIBriefing}
              disabled={generatingAI}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-2 cursor-pointer self-start md:self-auto disabled:opacity-50"
            >
              <RefreshCw size={13} className={generatingAI ? "animate-spin" : ""} />
              <span>{generatingAI ? "Compiling Intelligence..." : "Regenerate Briefing"}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-white/80 space-y-3.5">
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              {briefing?.executiveSummary ||
                "Vidya Bharati Public School is operating with strong institutional efficiency across all secondary departments."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Key Achievements */}
              <div className="neu-inset p-3.5 rounded-xl space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Key Achievements</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                  {(briefing?.keyAchievements || [
                    "English Department leads benchmarks at 89% overall mastery",
                    "98.5% homework submission rate recorded across sections",
                    "100% faculty coverage with balanced workload distribution",
                  ]).map((a: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Operational Risks */}
              <div className="neu-inset p-3.5 rounded-xl space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>Operational Watch</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                  {(briefing?.operationalRisks || [
                    "1 student monitored on counselor threshold adherence",
                    "Pre-board revision schedule required for Social Science",
                  ]).map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategic Recommendations */}
              <div className="neu-inset p-3.5 rounded-xl space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <TrendingUp size={13} />
                  <span>Board Recommendations</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                  {(briefing?.strategicRecommendations || [
                    "Conduct monthly inter-departmental pedagogy reviews",
                    "Circulate winter attendance adherence memo to parents",
                  ]).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
          {[
            { id: "classes", label: "Classes & Sections Health", icon: <ClipboardList size={14} /> },
            { id: "departments", label: "Department Benchmarks", icon: <BookOpen size={14} /> },
            { id: "atRisk", label: "Intervention Watchlist", icon: <AlertTriangle size={14} /> },
            { id: "faculty", label: "Faculty & Workload", icon: <UserCheck size={14} /> },
            { id: "audit", label: "Institutional Audit", icon: <FileText size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "neu-btn-primary text-white shadow-md shadow-amber-500/25"
                  : "neu-btn text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Classes & Sections Health */}
        {activeTab === "classes" && (
          <div className="neu-card p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Class Sections Academic Standing
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time delivery pacing, attendance averages, and class mentor leadership.
                </p>
              </div>
              <Link
                href="/admin/classes"
                className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Manage Classes</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Sections</th>
                    <th className="py-3 px-4">Students</th>
                    <th className="py-3 px-4">Class Teacher</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Academic Avg</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.classesOverview?.map((cls) => (
                    <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{cls.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="neu-inset px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                          {cls.sections.join(", ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{cls.studentCount} Students</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{cls.classTeacherName}</div>
                        <div className="text-[10px] text-slate-400">{cls.classTeacherEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600">{cls.attendanceRate}%</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-600">{cls.academicAverage}%</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cls.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Department Benchmarks */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data?.departmentPerformance?.map((dept) => (
                <div key={dept.id} className="neu-card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {dept.code}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800">{dept.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dept.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Department Average</span>
                      <span className="font-extrabold text-slate-800">{dept.averageScore}%</span>
                    </div>
                    <div className="neu-progress-track">
                      <div
                        className="neu-progress-fill bg-gradient-to-r from-amber-500 to-orange-600"
                        style={{ width: `${dept.averageScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="neu-inset p-3 rounded-xl grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Faculty</div>
                      <div className="font-extrabold text-slate-800">{dept.facultyCount} Assigned</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Passing Rate</div>
                      <div className="font-extrabold text-emerald-600">{dept.passingRate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Intervention & At-Risk Watchlist */}
        {activeTab === "atRisk" && (
          <div className="neu-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <span>Monitored Students &amp; Intervention Watch</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Identified by attendance thresholds (&lt;75%) or homework pacing deficits for counselor intervention.
                </p>
              </div>
            </div>

            {data?.atRiskStudents && data.atRiskStudents.length > 0 ? (
              <div className="space-y-3">
                {data.atRiskStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl bg-white/70 border border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-800">{st.name}</span>
                        <span className="neu-inset px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                          {st.className}-{st.section}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {st.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium space-y-0.5">
                        {st.riskFactors.map((rf, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-500">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{rf}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] font-bold text-indigo-600 pt-0.5">
                        Recommended: {st.recommendedAction}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-xs font-bold text-rose-600">{st.attendancePercentage}% Attendance</div>
                        <div className="text-[10px] text-slate-400 font-medium">{st.averageGrade}% Average</div>
                      </div>
                      <Link
                        href={`/student/chat`}
                        className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-800"
                      >
                        Contact Counselor
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="neu-inset p-8 text-center text-xs text-slate-500 font-medium rounded-xl">
                All secondary students are currently maintaining optimal attendance and academic pacing.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Faculty & Workload */}
        {activeTab === "faculty" && (
          <div className="neu-card p-6 sm:p-7 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Faculty Deployment &amp; Workload Distribution
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Teaching faculty assignments across secondary sections, course delivery, and active homework load.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Assigned Classes</th>
                    <th className="py-3 px-4">Subjects Taught</th>
                    <th className="py-3 px-4">Active Homework Sets</th>
                    <th className="py-3 px-4">Workload Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.facultyWorkload?.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{fac.name}</div>
                        <div className="text-[10px] text-slate-400">{fac.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {fac.classes.join(", ")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {fac.subjects.join(", ")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {fac.activeAssignmentsCount} Assignments
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            fac.loadStatus === "Balanced"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {fac.loadStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Institutional Audit Log */}
        {activeTab === "audit" && (
          <div className="neu-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Real-time Institutional Audit Trail
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Verified security log of academic assignments, allocations, and administrative changes.
                </p>
              </div>
              <Link
                href="/admin/audit"
                className="neu-btn px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5"
              >
                <span>Full Audit Explorer</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {data?.auditEvents?.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl bg-white/70 border border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800">{evt.actorName}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {evt.actorRole}
                    </span>
                    <span className="text-slate-600 font-medium">performed</span>
                    <span className="font-bold text-indigo-700">{evt.action}</span>
                    <span className="text-slate-400">on</span>
                    <span className="font-medium text-slate-700">{evt.targetType}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Institutional Governance Notice */}
        <div className="neu-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-amber-600 shrink-0" />
            <span>
              Principal Credentials verified for Vidya Bharati Public School. Institutional audit trail active.
            </span>
          </div>
          <Link
            href="/change-password"
            className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 shrink-0 self-start sm:self-auto"
          >
            Change Password
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
