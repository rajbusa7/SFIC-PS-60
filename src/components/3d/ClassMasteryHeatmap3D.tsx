"use client";

import React from "react";

export interface StudentMasteryPoint {
  studentName: string;
  conceptName: string;
  score: number; // 0 to 100
}

interface ClassMasteryHeatmap3DProps {
  data: StudentMasteryPoint[];
  students: string[];
  concepts: string[];
}

export const ClassMasteryHeatmap = React.memo(function ClassMasteryHeatmap({
  data,
  students,
  concepts,
}: ClassMasteryHeatmap3DProps) {
  if (students.length === 0 || concepts.length === 0) {
    return (
      <div className="w-full h-[220px] rounded-2xl bg-white border border-[#49352F]/12 flex items-center justify-center text-[#7A6862] text-xs">
        <span>No concept assessment data available yet.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-[#49352F]/12 dark:border-[#F2CAB3]/20 bg-white dark:bg-[#26201C] p-3 shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#49352F]/10 dark:border-[#F2CAB3]/15 text-[#7A6862] dark:text-[#C2B3AC]">
              <th className="p-2 font-bold text-[#49352F] dark:text-[#F4F1E1]">Student</th>
              {concepts.map((c, i) => (
                <th key={i} className="p-2 font-semibold truncate max-w-[120px]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, sIdx) => (
              <tr key={sIdx} className="border-b border-[#49352F]/8 dark:border-[#F2CAB3]/10 hover:bg-[#FAF6E9]/60 dark:hover:bg-[#2E2520]/60">
                <td className="p-2 font-bold text-[#49352F] dark:text-[#F4F1E1] whitespace-nowrap">{student}</td>
                {concepts.map((concept, cIdx) => {
                  const match = data.find(
                    (d) => d.studentName === student && d.conceptName === concept
                  );
                  const score = match ? match.score : 70;
                  const isGap = score < 60;
                  const isMastered = score >= 80;

                  return (
                    <td key={cIdx} className="p-2">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[11px] leading-none ${
                          isMastered
                            ? "bg-[#2E7D5E]/15 text-[#2E7D5E] border border-[#2E7D5E]/25 dark:bg-[#2E7D5E]/25 dark:text-[#4EE2A7] dark:border-[#4EE2A7]/35"
                            : isGap
                            ? "bg-[#FBECE9] text-[#A93327] border border-[#A93327]/25 dark:bg-[#C54738]/25 dark:text-[#FA8C7C] dark:border-[#FA8C7C]/35"
                            : "bg-[#FDF4E7] text-[#8D4E10] border border-[#8D4E10]/25 dark:bg-[#B26A1B]/25 dark:text-[#F2CAB3] dark:border-[#F2CAB3]/35"
                        }`}
                      >
                        {score}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#7A6862] dark:text-[#C2B3AC] px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5E] dark:bg-[#4EE2A7] shrink-0" />
          <span>&ge; 80% Mastered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B26A1B] dark:bg-[#F2CAB3] shrink-0" />
          <span>60-79% Developing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C54738] dark:bg-[#FA8C7C] shrink-0" />
          <span>&lt; 60% Needs Support</span>
        </div>
      </div>
    </div>
  );
});

export const ClassMasteryHeatmap3D = ClassMasteryHeatmap;
