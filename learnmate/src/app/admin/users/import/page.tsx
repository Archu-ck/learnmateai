"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  FileSpreadsheet,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Bulk CSV User Importer</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Provision rosters in bulk with automatic per-row validation, duplicate deduplication, and error reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Options */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Upload or Paste CSV</h2>

            {/* File Upload Box */}
            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50">
              <Upload size={22} className="text-indigo-600 mb-2" />
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
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Load Sample CSV
              </button>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,email,role,class,section,admissionNo&#10;Alice Walker,alice@school.edu,student,Grade 8,A,STU-101"
              className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />

            <button
              onClick={handleImport}
              disabled={loading || !csvText.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              <FileSpreadsheet size={15} />
              <span>{loading ? "Validating & Importing..." : "Process CSV Import"}</span>
            </button>
          </div>

          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1.5 leading-relaxed">
            <p className="font-bold text-[11px] text-indigo-700 uppercase tracking-wider">CSV Requirements</p>
            <p>Headers: <code>name,email,role,class,section,admissionNo</code></p>
            <p>Supported roles: <code>admin, principal, coordinator, teacher, counsellor, student, parent</code></p>
          </div>
        </div>

        {/* Right Column: Preview & Detailed Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Results Report Card */}
          {report && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Import Processing Report</h3>
                  <p className="text-xs text-slate-500">Summary of executed row validations and accounts created</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">
                    {report.summary.createdCount} Created
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg">
                    {report.summary.skippedCount} Duplicates
                  </span>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg">
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
                  <div className="border border-emerald-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-emerald-50/60 text-emerald-800 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Temp Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 bg-white">
                        {report.created.map((u) => (
                          <tr key={u.id} className="hover:bg-emerald-50/30">
                            <td className="py-2 px-3 font-mono text-slate-400">#{u.row}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">{u.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{u.email}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-600 select-all">
                              {u.temporaryPassword}
                            </td>
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
                  <div className="border border-amber-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-amber-50/60 text-amber-800 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50 bg-white">
                        {report.skippedDuplicates.map((d, i) => (
                          <tr key={i} className="hover:bg-amber-50/30">
                            <td className="py-2 px-3 font-mono text-slate-400">#{d.row}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">{d.email}</td>
                            <td className="py-2 px-3 text-amber-800 font-medium">{d.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors List */}
              {report.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>Validation Errors ({report.errors.length})</span>
                  </h4>
                  <div className="border border-rose-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-rose-50/60 text-rose-800 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Identifier</th>
                          <th className="py-2 px-3">Error Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50 bg-white">
                        {report.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-rose-50/30">
                            <td className="py-2 px-3 font-mono text-slate-400">#{err.row}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">{err.email}</td>
                            <td className="py-2 px-3 text-rose-700 font-medium">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Raw Preview Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Parsed Content Preview ({previewRows.length > 1 ? previewRows.length - 1 : 0} rows)
              </h3>
              {previewRows.length > 0 && (
                <span className="text-[11px] text-slate-400">Detected valid tabular structure</span>
              )}
            </div>

            {previewRows.length > 0 ? (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      {previewRows[0].map((h, i) => (
                        <th key={i} className="py-2 px-3 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {previewRows.slice(1, 11).map((r, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-400">#{rowIdx + 2}</td>
                        {r.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 text-slate-700">
                            {cell || <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No CSV data loaded yet. Upload a CSV file or click "Load Sample CSV" to test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
