"use client";

import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Download, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { broadcastDataUpdate } from "@/lib/events";

interface ParsedStudentRow {
  studentCode: string;
  displayName: string;
  grade: number;
  section: string;
  notes?: string;
  isDuplicate?: boolean;
}

export function StudentCsvModal({
  isOpen,
  onClose,
  existingCodes = [],
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingCodes: string[];
  onSuccess: () => void;
}) {
  const { language } = useLanguage();
  const [csvContent, setCsvContent] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const sampleCsv = `studentCode,displayName,grade,section,notes
MPS-4A-07,Kush Trivedi,4,A,Quick learner in arithmetic
MPS-4A-08,Dhyani Joshi,4,A,Enjoys language reading
MPS-3A-06,Pranav Dave,3,A,Hands-on visual learner`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "shikshasetu_students_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors([
        language === "gu"
          ? "CSV માં હેડર પંક્તિ અને ઓછામાં ઓછી ૧ વિદ્યાર્થી પંક્તિ હોવી આવશ્યક છે."
          : "CSV must contain a header row and at least 1 student row.",
      ]);
      return;
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const codeIdx = header.indexOf("studentcode");
    const nameIdx = header.indexOf("displayname");
    const gradeIdx = header.indexOf("grade");
    const sectionIdx = header.indexOf("section");
    const notesIdx = header.indexOf("notes");

    if (codeIdx === -1 || nameIdx === -1 || gradeIdx === -1 || sectionIdx === -1) {
      setParseErrors([
        language === "gu"
          ? "CSV હેડરમાં આવશ્યક કૉલમ્સ હોવા આવશ્યક છે: studentCode, displayName, grade, section"
          : "CSV header must contain required columns: studentCode, displayName, grade, section",
      ]);
      return;
    }

    const rows: ParsedStudentRow[] = [];
    const errors: string[] = [];
    const seenInFile = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      const studentCode = parts[codeIdx];
      const displayName = parts[nameIdx];
      const grade = parseInt(parts[gradeIdx], 10);
      const section = parts[sectionIdx] || "A";
      const notes = notesIdx !== -1 ? parts[notesIdx] : "";

      if (!studentCode || !displayName) {
        errors.push(
          language === "gu"
            ? `પંક્તિ ${i + 1}: વિદ્યાર્થી કોડ અથવા નામ ખૂટે છે.`
            : `Row ${i + 1}: Missing student code or display name.`
        );
        continue;
      }
      if (isNaN(grade) || grade < 1 || grade > 5) {
        errors.push(
          language === "gu"
            ? `પંક્તિ ${i + 1}: ધોરણ ૧ થી ૫ વચ્ચેની સંખ્યા હોવી આવશ્યક છે.`
            : `Row ${i + 1}: Grade must be a number between 1 and 5.`
        );
        continue;
      }

      const isDuplicate = existingCodes.includes(studentCode) || seenInFile.has(studentCode);
      seenInFile.add(studentCode);

      rows.push({
        studentCode,
        displayName,
        grade,
        section,
        notes,
        isDuplicate,
      });
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => !r.isDuplicate);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      for (const row of validRows) {
        await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentCode: row.studentCode,
            displayName: row.displayName,
            grade: row.grade,
            section: row.section,
            classroomId: `cls-${row.grade}${row.section.toLowerCase()}`,
            notes: row.notes || "",
            enrollmentStatus: "active",
          }),
        });
      }
      broadcastDataUpdate("students", "create");
      onSuccess();
      onClose();
    } catch {
      setParseErrors([
        language === "gu"
          ? "આયાત દરમિયાન ક્ષતિ આવી. કૃપા કરીને પુનઃપ્રયાસ કરો."
          : "An error occurred during import. Please retry.",
      ]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === "gu"
          ? "CSV દ્વારા વિદ્યાર્થી યાદી આયાત કરો"
          : "Import Student Roster via CSV"
      }
      description={
        language === "gu"
          ? "સ્વચાલિત ડુપ્લિકેટ શોધ અને ડેટા માન્યતા સાથે વર્ગખંડ યાદીઓ અપલોડ કરો."
          : "Upload classroom lists with automatic duplicate detection and data validation."
      }
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Sample Download Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>
              {language === "gu" ? "સત્તાવાર નમૂનાની જરૂર છે?" : "Need the official template?"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === "gu" ? "નમૂના CSV ડાઉનલોડ કરો" : "Download Sample CSV"}</span>
          </button>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center transition-colors">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
            <span>{language === "gu" ? "CSV ફાઇલ પસંદ કરવા માટે ક્લિક કરો" : "Click to select CSV file"}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === "gu"
              ? "૨MB સુધીની UTF-8 એન્કોડેડ .csv ફાઇલો"
              : "UTF-8 encoded .csv files up to 2MB"}
          </p>
        </div>

        {/* Errors list */}
        {parseErrors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <AlertCircle className="w-4 h-4" />
              <span>{language === "gu" ? "માન્યતા ચેતવણીઓ:" : "Validation Warnings:"}</span>
            </div>
            {parseErrors.map((err, i) => (
              <p key={i} className="text-[11px] text-rose-700 ml-5">
                • {err}
              </p>
            ))}
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>
                {language === "gu"
                  ? `પૂર્વાવલોકન (${parsedRows.length} રેકોર્ડ્સ મળ્યા)`
                  : `Preview (${parsedRows.length} records found)`}
              </span>
              <span className="text-emerald-600">
                {language === "gu"
                  ? `${parsedRows.filter((r) => !r.isDuplicate).length} આયાત માટે તૈયાર`
                  : `${parsedRows.filter((r) => !r.isDuplicate).length} ready to import`}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-2">{language === "gu" ? "કોડ" : "Code"}</th>
                    <th className="p-2">{language === "gu" ? "નામ" : "Name"}</th>
                    <th className="p-2">{language === "gu" ? "વર્ગ" : "Class"}</th>
                    <th className="p-2">{language === "gu" ? "સ્થિતિ" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className={r.isDuplicate ? "bg-amber-50/50" : ""}>
                      <td className="p-2 font-mono font-medium">{r.studentCode}</td>
                      <td className="p-2">{r.displayName}</td>
                      <td className="p-2">
                        {language === "gu" ? `ધોરણ ${r.grade}-${r.section}` : `Class ${r.grade}-${r.section}`}
                      </td>
                      <td className="p-2">
                        {r.isDuplicate ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            {language === "gu" ? "ડુપ્લિકેટ અવગણાયું" : "Duplicate Skipped"}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {language === "gu" ? "માન્ય" : "Valid"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            {language === "gu" ? "રદ કરો" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={parsedRows.filter((r) => !r.isDuplicate).length === 0 || isImporting}
            onClick={handleCommitImport}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isImporting
              ? language === "gu"
                ? "આયાત થઈ રહ્યું છે..."
                : "Importing..."
              : language === "gu"
              ? `${parsedRows.filter((r) => !r.isDuplicate).length} વિદ્યાર્થીઓ આયાત કરો`
              : `Import ${parsedRows.filter((r) => !r.isDuplicate).length} Students`}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
