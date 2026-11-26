"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, Sparkles, BookOpen } from "lucide-react";

export interface SkillNode {
  id: string;
  name: string;
  subject: string;
  score: number; // 0 to 100
  status: "mastered" | "gap" | "developing" | "locked";
  reason?: string;
  baselineScore?: number;
  position?: [number, number, number];
  connectedTo?: string[];
}

export interface StudentSkillTree3DProps {
  studentName: string;
  skills: SkillNode[];
  onSelectSkill?: (skill: SkillNode) => void;
  onGeneratePlan?: (skill: SkillNode) => void;
}

export const StudentSkillTree2D = React.memo(function StudentSkillTree2D({
  studentName,
  skills,
  onSelectSkill,
  onGeneratePlan,
}: StudentSkillTree3DProps) {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    skills[0]?.id || null
  );

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  if (!skills || skills.length === 0) {
    return (
      <div className="w-full h-[240px] rounded-3xl bg-white border border-[#49352F]/12 flex flex-col items-center justify-center p-6 text-center text-[#7A6862]">
        <BookOpen className="w-8 h-8 text-[#B26A1B] mb-2 opacity-50" />
        <p className="font-bold text-sm text-[#49352F]">No Evaluated Concepts Yet</p>
        <p className="text-xs text-[#7A6862] mt-1">Complete diagnostic assessments to populate {studentName}&apos;s competency graph.</p>
      </div>
    );
  }

  const masteredCount = skills.filter((s) => s.status === "mastered").length;
  const gapCount = skills.filter((s) => s.status === "gap").length;
  const developingCount = skills.filter((s) => s.status === "developing").length;

  return (
    <div className="space-y-4">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-white border border-[#49352F]/12 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2E7D5E]/15 text-[#2E7D5E] flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#7A6862] block font-semibold uppercase">Mastered</span>
            <span className="text-base font-black text-[#2E7D5E]">{masteredCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#49352F]/12 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#B26A1B]/15 text-[#B26A1B] flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#7A6862] block font-semibold uppercase">Developing</span>
            <span className="text-base font-black text-[#B26A1B]">{developingCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#49352F]/12 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C54738]/15 text-[#C54738] flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[#7A6862] block font-semibold uppercase">Needs Support</span>
            <span className="text-base font-black text-[#C54738]">{gapCount}</span>
          </div>
        </div>
      </div>

      {/* Main 2D Competency Card Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {skills.map((skill) => {
          const isSelected = skill.id === selectedSkillId;
          const isMastered = skill.status === "mastered";
          const isGap = skill.status === "gap";

          return (
            <div
              key={skill.id}
              onClick={() => {
                setSelectedSkillId(skill.id);
                if (onSelectSkill) onSelectSkill(skill);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                isSelected
                  ? "border-[#B26A1B] ring-2 ring-[#B26A1B]/20 shadow-sm"
                  : "border-[#49352F]/12 hover:border-[#49352F]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#7A6862] block">
                    {skill.subject}
                  </span>
                  <h4 className="font-heading font-bold text-xs text-[#49352F] line-clamp-1">
                    {skill.name}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isMastered
                      ? "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/20"
                      : isGap
                      ? "bg-[#C54738]/15 text-[#C54738] border border-[#C54738]/20"
                      : "bg-[#B26A1B]/15 text-[#B26A1B] border border-[#B26A1B]/20"
                  }`}
                >
                  {isMastered ? "Mastered" : isGap ? "Support Needed" : "Developing"}
                </span>
              </div>

              {/* Score Progress Bar */}
              <div className="space-y-1 mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#7A6862]">Proficiency</span>
                  <span className="font-black text-[#49352F]">{skill.score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF6E9] border border-[#49352F]/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isMastered ? "bg-[#2E7D5E]" : isGap ? "bg-[#C54738]" : "bg-[#B26A1B]"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, skill.score))}%` }}
                  />
                </div>
              </div>

              {/* Action for Learning Gaps */}
              {isGap && onGeneratePlan && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePlan(skill);
                  }}
                  className="mt-3 w-full py-1.5 px-3 rounded-xl bg-[#FAF6E9] hover:bg-[#F2CAB3] text-[#B26A1B] hover:text-[#49352F] border border-[#B26A1B]/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Create Remedial Plan</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const StudentSkillTree3D = StudentSkillTree2D;
export const StudentSkillTree = StudentSkillTree2D;
export default StudentSkillTree2D;
