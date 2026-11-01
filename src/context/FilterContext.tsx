"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

/**
 * Robust utility to parse a grade number (1 to 5) from any representation:
 * e.g., 1, "1", "cls-1a", "cls-1", "Class 1", "Standard 1", "ધોરણ ૧"
 */
export function parseGradeNumber(cls: string | number | null | undefined): number | null {
  if (cls === null || cls === undefined) return null;
  if (typeof cls === "number") return cls >= 1 && cls <= 5 ? cls : null;
  const str = String(cls).trim().toLowerCase();
  if (!str || str === "all") return null;

  // Single digit 1-5
  if (/^[1-5]$/.test(str)) return Number(str);

  // Classroom ID pattern: cls-1a, cls-1, etc.
  const clsMatch = str.match(/cls-([1-5])/);
  if (clsMatch) return Number(clsMatch[1]);

  // Textual patterns: Class 1, Standard 1, Grade 1, Std 1, ધોરણ ૧
  const textMatch = str.match(/(?:class|standard|grade|std|ધોરણ)\s*([1-5૧-૫])/i);
  if (textMatch) {
    const raw = textMatch[1];
    // Map Gujarati digits to numbers if needed
    const gujMap: Record<string, number> = { "૧": 1, "૨": 2, "૩": 3, "૪": 4, "૫": 5 };
    if (gujMap[raw]) return gujMap[raw];
    const n = Number(raw);
    if (!isNaN(n) && n >= 1 && n <= 5) return n;
  }

  return null;
}

/**
 * Normalizes any grade/class input to canonical classroomId or 'all'.
 */
export function normalizeClassroomId(val: string | number | null | undefined): string {
  if (!val || val === "all") return "all";
  const grade = parseGradeNumber(val);
  if (grade !== null) return `cls-${grade}a`;
  return String(val);
}

interface FilterContextType {
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  gradeNumber: number | null;
  selectedGrade: number | null;
  activeGradeString: string;
}

const FilterContext = createContext<FilterContextType>({
  selectedClass: "all",
  setSelectedClass: () => {},
  searchTerm: "",
  setSearchTerm: () => {},
  gradeNumber: null,
  selectedGrade: null,
  activeGradeString: "all",
});

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedClass, setSelectedClassRaw] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const gradeNumber = useMemo(() => parseGradeNumber(selectedClass), [selectedClass]);

  const setSelectedClass = (cls: string) => {
    if (!cls || cls === "all") {
      setSelectedClassRaw("all");
    } else {
      const parsed = parseGradeNumber(cls);
      if (parsed !== null) {
        setSelectedClassRaw(`cls-${parsed}a`);
      } else {
        setSelectedClassRaw(cls);
      }
    }
  };

  const activeGradeString = gradeNumber !== null ? String(gradeNumber) : "all";

  return (
    <FilterContext.Provider
      value={{
        selectedClass,
        setSelectedClass,
        searchTerm,
        setSearchTerm,
        gradeNumber,
        selectedGrade: gradeNumber,
        activeGradeString,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  return useContext(FilterContext);
}
