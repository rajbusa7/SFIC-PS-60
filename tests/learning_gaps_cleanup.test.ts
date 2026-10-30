import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  formatClassLabel,
  normalizePriority,
  formatPriorityLabel,
  normalizeGapStatus,
  formatGapStatusLabel,
  resolveSubject,
  formatSubjectLabel,
} from "../src/lib/learningGapFormatters";

describe("Phase 1: Learning Gaps Module Cleanup and Data Correction", () => {
  // --------------------------------------------------------------------------
  // 1. Class and Section Label Formatting
  // --------------------------------------------------------------------------
  describe("1. Class and Section Labels", () => {
    test("Eliminates invalid section suffixes like -undefined and -null", () => {
      assert.equal(formatClassLabel("Class 4-undefined"), "Class 4");
      assert.equal(formatClassLabel("Class 3-null"), "Class 3");
      assert.equal(formatClassLabel("Class 5-NaN"), "Class 5");
    });

    test("Formats valid class and section accurately", () => {
      assert.equal(formatClassLabel("Class 4-A"), "Class 4-A");
      assert.equal(formatClassLabel("cls-4a"), "Class 4-A");
      assert.equal(formatClassLabel(4, "A"), "Class 4-A");
      assert.equal(formatClassLabel({ grade: 4, section: "B" }), "Class 4-B");
    });

    test("Appends section ONLY when a valid section exists", () => {
      assert.equal(formatClassLabel(4, undefined), "Class 4");
      assert.equal(formatClassLabel(3, null), "Class 3");
      assert.equal(formatClassLabel(5, ""), "Class 5");
      assert.equal(formatClassLabel({ grade: 4 }), "Class 4");
    });

    test("Handles missing or malformed class data by returning empty string (never displaying Class undefined)", () => {
      assert.equal(formatClassLabel("Class undefined"), "");
      assert.equal(formatClassLabel("Class null"), "");
      assert.equal(formatClassLabel("Class NaN"), "");
      assert.equal(formatClassLabel(undefined), "");
      assert.equal(formatClassLabel(null), "");
      assert.equal(formatClassLabel(NaN), "");
    });

    test("Properly formats in Gujarati language mode", () => {
      assert.equal(formatClassLabel("Class 4-undefined", undefined, "gu"), "ધોરણ ૪");
      assert.equal(formatClassLabel(4, "A", "gu"), "ધોરણ ૪-અ");
      assert.equal(formatClassLabel("Class undefined", undefined, "gu"), "");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Priority Label Duplication & Standardization
  // --------------------------------------------------------------------------
  describe("2. Priority Standardization and Duplication Prevention", () => {
    test("Normalizes duplicate priority suffixes like 'Low Priority Priority'", () => {
      assert.equal(normalizePriority("Low Priority Priority"), "Low Priority");
      assert.equal(normalizePriority("Medium Priority Priority"), "Medium Priority");
      assert.equal(normalizePriority("High Priority Priority"), "High Priority");
    });

    test("Standardizes all priority inputs to exactly High, Medium, or Low Priority", () => {
      assert.equal(normalizePriority("High"), "High Priority");
      assert.equal(normalizePriority("HIGH"), "High Priority");
      assert.equal(normalizePriority("medium"), "Medium Priority");
      assert.equal(normalizePriority("LOW"), "Low Priority");
      assert.equal(normalizePriority("  high  "), "High Priority");
    });

    test("Formats priority label in English without duplicating suffixes", () => {
      assert.equal(formatPriorityLabel("High Priority"), "High Priority");
      assert.equal(formatPriorityLabel("High"), "High Priority");
      assert.equal(formatPriorityLabel("High Priority Priority"), "High Priority");
    });

    test("Formats priority label in Gujarati without duplicating suffixes", () => {
      assert.equal(formatPriorityLabel("High Priority", "gu"), "ઉચ્ચ અગ્રતા");
      assert.equal(formatPriorityLabel("Medium Priority", "gu"), "મધ્યમ અગ્રતા");
      assert.equal(formatPriorityLabel("Low Priority", "gu"), "સામાન્ય અગ્રતા");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Learning Gap Status Standardization
  // --------------------------------------------------------------------------
  describe("3. Status Standardization", () => {
    test("Standardizes all statuses to exactly Needs Support, Developing, or Mastered", () => {
      assert.equal(normalizeGapStatus("Needs Support"), "Needs Support");
      assert.equal(normalizeGapStatus("Developing"), "Developing");
      assert.equal(normalizeGapStatus("Mastered"), "Mastered");
    });

    test("Corrects legacy or inconsistent status naming to standardized tiers", () => {
      assert.equal(normalizeGapStatus("Active"), "Needs Support");
      assert.equal(normalizeGapStatus("Under Intervention"), "Developing");
      assert.equal(normalizeGapStatus("Resolved"), "Mastered");
      assert.equal(normalizeGapStatus("in progress"), "Developing");
      assert.equal(normalizeGapStatus("completed"), "Mastered");
    });

    test("Formats standardized statuses correctly in Gujarati", () => {
      assert.equal(formatGapStatusLabel("Needs Support", "gu"), "સહાયની જરૂર છે");
      assert.equal(formatGapStatusLabel("Developing", "gu"), "વિકાસશીલ");
      assert.equal(formatGapStatusLabel("Mastered", "gu"), "નિપુણ");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Subject Mapping
  // --------------------------------------------------------------------------
  describe("4. Subject Mapping Accuracy", () => {
    test("Correctly maps Short Passage Reading Comprehension to English (never Mathematics)", () => {
      const res = resolveSubject("Short Passage Reading Comprehension");
      assert.equal(res.code, "ENG");
      assert.equal(res.name, "English");
      assert.equal(formatSubjectLabel("c-eng-comp-01", "en"), "English");
      assert.equal(formatSubjectLabel("c-eng-comp-01", "gu"), "અંગ્રેજી");
    });

    test("Correctly maps grammar and language concepts to English or Gujarati", () => {
      assert.equal(resolveSubject("Subject-Verb Agreement").code, "ENG");
      assert.equal(resolveSubject("Phonetic Blends (ch, sh, th, wh)").code, "ENG");
      assert.equal(resolveSubject("કાનો-માત્રા અને દીર્ઘ-હ્રસ્વ સ્વર ચિહ્નો (Gujarati Matras)").code, "GUJ");
    });

    test("Correctly maps arithmetic concepts to Mathematics", () => {
      assert.equal(resolveSubject("Division Basics & Equal Sharing").code, "MATH");
      assert.equal(resolveSubject("Multiplication Tables (2 to 9)").code, "MATH");
      assert.equal(resolveSubject("Place Value & 3-Digit Addition").code, "MATH");
    });

    test("Correctly maps environmental concepts to EVS", () => {
      assert.equal(resolveSubject("Water Cycle & Conservation").code, "EVS");
      assert.equal(resolveSubject("Parts of Plants & Their Functions").code, "EVS");
    });
  });
});

