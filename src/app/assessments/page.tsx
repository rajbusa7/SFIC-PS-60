"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { subscribeToDataUpdates } from "@/lib/events";
import {
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function AssessmentsPage() {
  const { t, language, formatSubject, formatClass } = useLanguage();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments");
      const data = await res.json();
      if (data.success) {
        setAssessments(data.assessments || []);
        setConcepts(data.concepts || []);
      }
    } catch (e) {
      console.error("Failed to load assessments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
    const unsubscribe = subscribeToDataUpdates(() => {
      fetchAssessments();
    }, ["assessments", "all"]);
    return () => unsubscribe();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    if (subjectFilter !== "all" && a.subjectCode !== subjectFilter) return false;
    return true;
  });

  const getConceptNames = (conceptIds: string[]) => {
    if (!conceptIds || !Array.isArray(conceptIds)) return [];
    return conceptIds
      .map((id) => concepts.find((c) => c.id === id)?.name || id)
      .slice(0, 3);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#49352F] tracking-tight font-heading">
              {t.assessments.title || "Classroom Assessments & Diagnostic Evaluations"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6862] mt-0.5">
              {t.assessments.subtitle || "Record concept-level assessment results to automatically trigger learning-gap detection."}
            </p>
          </div>

          <Link
            href="/assessments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F2CAB3] hover:bg-white text-[#49352F] border border-[#49352F]/16 text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-center"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.actions.createAssessment}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/95 border border-[#49352F]/12 shadow-[0_4px_16px_rgba(73,53,47,0.04)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#7A6862]">
              {language === "gu" ? "વિષય દ્વારા ફિલ્ટર કરો:" : "Filter by Subject:"}
            </span>
            <select
              value={subjectFilter}
              aria-label="Filter assessments by subject"
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-xl border border-[#49352F]/15 bg-[#FAF6E9] px-3 py-1.5 text-xs font-semibold text-[#49352F] outline-hidden cursor-pointer"
            >
              <option value="all">{language === "gu" ? "બધા વિષયો" : "All Subjects"}</option>
              <option value="MATH">{formatSubject("MATH")}</option>
              <option value="ENG">{formatSubject("ENG")}</option>
              <option value="GUJ">{formatSubject("GUJ")}</option>
              <option value="EVS">{formatSubject("EVS")}</option>
            </select>
          </div>
          <span className="text-xs text-[#7A6862]">
            {filteredAssessments.length} {language === "gu" ? "મૂલ્યાંકન રેકોર્ડ્સ" : "assessment records"}
          </span>
        </div>

        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((asm) => {
            const conceptNames = getConceptNames(asm.conceptIds);

            return (
              <Card key={asm.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" size="sm">
                      {formatSubject(asm.subjectCode)}
                    </Badge>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        asm.status === "published"
                          ? "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20"
                          : "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                      }`}
                    >
                      {asm.status === "published"
                        ? language === "gu"
                          ? "પ્રકાશિત અને વિશ્લેષિત"
                          : "Published & Analyzed"
                        : language === "gu"
                        ? "ડ્રાફ્ટ"
                        : "Draft"}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-[#49352F] mt-2 line-clamp-2">
                    {asm.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-[#7A6862] mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#B26A1B]" />
                      <span>{asm.assessmentDate}</span>
                    </span>
                    <span>
                      {language === "gu" ? "કુલ ગુણ:" : "Max Marks:"}{" "}
                      <strong className="text-[#49352F]">{asm.maxMarks}</strong>
                    </span>
                  </div>

                  {/* Concepts evaluated */}
                  <div className="mt-3 pt-3 border-t border-[#49352F]/10">
                    <span className="text-[11px] font-semibold text-[#7A6862] uppercase tracking-wider block mb-1">
                      {language === "gu" ? "મૂલ્યાંકન કરાયેલ સંકલ્પનાઓ:" : "Target Concepts Assessed:"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {conceptNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="bg-[#FAF6E9] text-[#49352F] border border-[#49352F]/10 text-[11px] font-medium px-2 py-0.5 rounded-md"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#49352F]/10 flex items-center justify-between">
                  <span className="text-[11px] text-[#7A6862]">{formatClass("Class 4-A")}</span>
                  <Link
                    href={`/students`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#B26A1B] hover:text-[#49352F]"
                  >
                    <span>{language === "gu" ? "વિદ્યાર્થી ગુણ જુઓ" : "View Student Scores"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
