"use client";

import React, { createContext, useContext, useState } from "react";

export function parseGradeNumber(val: any): number | null {
  if (val === null || val === undefined || val === "" || val === "all") return null;
  if (typeof val === "number") return val >= 1 && val <= 5 ? val : null;
  const str = String(val).trim().toLowerCase();
  if (str === "all") return null;

  // Support Gujarati numerals (૧-૫)
  const gujMap: Record<string, number> = {
    "૧": 1,
    "૨": 2,
    "૩": 3,
    "૪": 4,
    "૫": 5,
  };
  for (const [char, num] of Object.entries(gujMap)) {
    if (str.includes(char)) return num;
  }

  const match = str.match(/(?:cls-|class\s*|standard\s*|grade\s*|std\s*|ધોરણ\s*)?([1-5])/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

export function normalizeClassroomId(val: any): string {
  if (!val || val === "all") return "all";
  const num = parseGradeNumber(val);
  if (num) return `cls-${num}a`;
  return String(val);
}

interface FilterContextType {
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  gradeNumber: number | null;
}

const FilterContext = createContext<FilterContextType>({
  selectedClass: "all",
  setSelectedClass: () => {},
  searchTerm: "",
  setSearchTerm: () => {},
  gradeNumber: null,
});

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const gradeNumber = parseGradeNumber(selectedClass);

  return (
    <FilterContext.Provider
      value={{
        selectedClass,
        setSelectedClass,
        searchTerm,
        setSearchTerm,
        gradeNumber,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  return useContext(FilterContext);
}
