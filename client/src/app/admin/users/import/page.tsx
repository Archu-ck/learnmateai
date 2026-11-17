"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface ImportReport {
  created: Array<{ row: number; id: string; name: string; email: string; role: string; temporaryPassword: string }>;
  skippedDuplicates: Array<{ row: number; email: string; reason: string }>;
  errors: Array<{ row: number; email: string; error: string }>;
  summary: {
    totalRows: number;
    createdCount: number;
    skippedCount: number;
    errorCount: number;
  };
}

const sampleCSV = `name,email,role,class,section,admissionNo
Ananya Gupta,ananya.g@learnmate.test,student,Grade 8,A,STU-2026-101
Vikram Malhotra,vikram.m@learnmate.test,student,Grade 8,B,STU-2026-102
Pooja Nair,pooja.n@learnmate.test,teacher,,,
admin@learnmate.test,admin@learnmate.test,student,Grade 8,A,STU-DUP
Bad Role User,bad.user@learnmate.test,astronaut,Grade 8,A,STU-ERR`;

export default function CSVImportPage() {
  const { toast } = useToast();

  const [csvText, setCsvText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text || "");
      };
      reader.readAsText(uploadedFile);
    }
  };

  const loadSample = () => {
    setCsvText(sampleCSV);
    setFileName("sample_roster.csv");
    setFile(null);
    setReport(null);
    toast("Sample CSV loaded with valid rows, duplicate email, and bad role.");
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast("Please upload a CSV file or paste CSV content.", "error");
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const res = await api.post<{ message: string; report: ImportReport }>(
        "/api/admin/users/import",
        { csvText }
      );
      setReport(res.report);
      toast(res.message);
    } catch (err: any) {
      toast(err.message || "Failed to import CSV", "error");
    } finally {
      setLoading(false);
    }
  };

  // Simple preview lines
  const previewRows = csvText
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((c) => c.trim()))
    .filter((row) => row.length > 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Bulk CSV User Importer</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Provision rosters in bulk with automatic per-row validation, duplicate deduplication, and error reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Options */}
        <div className="lg:col-span-1 space-y-4">
          <div className="neu-card p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload or Paste CSV</h2>

            {/* File Upload Box */}
            <label className="neu-inset p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.01]">
              <Upload size={24} className="text-indigo-600 mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {fileName ? fileName : "Select CSV File"}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Drag and drop or click to browse</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Or paste CSV text below</span>
              <button
                type="button"
                onClick={loadSample}
                className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                Load Sample CSV
              </button>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,email,role,class,section,admissionNo&#10;Alice Walker,alice@school.edu,student,Grade 8,A,STU-101"
              className="neu-input w-full font-mono text-[11px]"
            />

            <button
              onClick={handleImport}
              disabled={loading || !csvText.trim()}
              className="w-full neu-btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <FileSpreadsheet size={16} />
              <span>{loading ? "Validating & Importing..." : "Process CSV Import"}</span>
            </button>
          </div>

          <div className="neu-card p-5 text-xs text-indigo-950 space-y-2 leading-relaxed">
            <p className="font-bold text-[11px] text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>CSV Format Specifications</span>
            </p>
            <p className="text-slate-600">Headers: <code className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">name,email,role,class,section,admissionNo</code></p>
            <p className="text-slate-600">Roles: <code className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">admin, principal, teacher, student, parent</code></p>
          </div>
        </div>

        {/* Right Column: Preview & Detailed Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Results Report Card */}
          {report && (
            <div className="neu-card p-6 space-y-5 animate-in fade-in-50">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200/60">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Import Processing Report</h3>
                  <p className="text-xs text-slate-400 font-medium">Summary of executed row validations and accounts created</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-200/60 text-xs font-bold rounded-lg">
                    {report.summary.createdCount} Created
                  </span>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 border border-amber-200/60 text-xs font-bold rounded-lg">
                    {report.summary.skippedCount} Duplicates
                  </span>
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-700 border border-rose-200/60 text-xs font-bold rounded-lg">
                    {report.summary.errorCount} Errors
                  </span>
                </div>
              </div>

              {/* Created Users List */}
              {report.created.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Successfully Created ({report.created.length})</span>
                  </h4>
                  <div className="neu-inset p-3 overflow-x-auto text-xs">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-slate-500 font-bold text-[11px] border-b border-slate-200/60">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3 text-right">Temp Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {report.created.map((u) => (
                          <tr key={u.id} className="text-slate-700">
                            <td className="py-2 px-3 font-sans font-bold">#{u.row}</td>
                            <td className="py-2 px-3 font-sans font-semibold">{u.name}</td>
                            <td className="py-2 px-3 text-slate-500">{u.email}</td>
                            <td className="py-2 px-3 uppercase text-[10px] font-sans font-bold">{u.role}</td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-600">{u.temporaryPassword}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Skipped Duplicates */}
              {report.skippedDuplicates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>Skipped Duplicates ({report.skippedDuplicates.length})</span>
                  </h4>
                  <div className="neu-inset p-3 overflow-x-auto text-xs">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-slate-500 font-bold text-[11px] border-b border-slate-200/60">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.skippedDuplicates.map((d, i) => (
                          <tr key={i} className="text-slate-700">
                            <td className="py-2 px-3 font-bold text-amber-700">#{d.row}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{d.email}</td>
                            <td className="py-2 px-3 text-slate-500">{d.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {report.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>Errors Encountered ({report.errors.length})</span>
                  </h4>
                  <div className="neu-inset p-3 overflow-x-auto text-xs">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-slate-500 font-bold text-[11px] border-b border-slate-200/60">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Error Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.errors.map((e, i) => (
                          <tr key={i} className="text-slate-700">
                            <td className="py-2 px-3 font-bold text-rose-700">#{e.row}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{e.email || "—"}</td>
                            <td className="py-2 px-3 text-rose-600 font-medium">{e.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw CSV Preview Table */}
          <div className="neu-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Parsed Data Preview {previewRows.length > 0 && `(${previewRows.length} lines)`}
              </h3>
            </div>

            {previewRows.length > 0 ? (
              <div className="overflow-x-auto neu-inset p-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-slate-500 font-bold text-[11px]">
                      {previewRows[0].map((h, i) => (
                        <th key={i} className="py-2 px-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.slice(1, 11).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/40">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                            {val || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewRows.length > 11 && (
                  <p className="text-[10px] text-slate-400 text-center py-2">
                    ... showing first 10 rows of {previewRows.length - 1} records
                  </p>
                )}
              </div>
            ) : (
              <div className="neu-inset p-10 text-center text-slate-400 text-xs">
                Upload a CSV file or paste raw CSV text to view parsed rows preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
