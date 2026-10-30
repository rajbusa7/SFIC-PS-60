import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generatePedagogicalPrescription,
  identifyConceptKey,
} from "../src/lib/engine/prescriptionEngine";

describe("Phase 4: Pedagogical Prescription Engine", () => {
  // --------------------------------------------------------------------------
  // Table 1: Minimum Required Combinations from Section 11
  // --------------------------------------------------------------------------

  it("Test 1: Place Value (Needs Support) prescribes base-10 blocks and place-value chart", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-place-01",
      conceptName: "Place Value",
      status: "Needs Support",
      subject: "MATH",
    });

    assert.equal(p.conceptKey, "PLACE_VALUE");
    assert.match(p.activity, /place-value chart/i);
    assert.match(p.activity, /base-10 blocks/i);
    assert.match(p.reason, /concrete representations help students understand/i);
    assert.equal(p.duration, "10 minutes");
    assert.match(p.reassessment, /place-value chart/i);
    assert.equal(p.recommendationType, "Remedial Practice");
    assert.equal(p.remedialPlanEligible, true);
    assert.equal(p.planStatusLabel, "Ready for 5-Step Concrete Remedial Plan");
  });

  it("Test 2: Place Value (Developing) prescribes focused place-value practice", () => {
    const p = generatePedagogicalPrescription({
      conceptName: "Place Value",
      status: "Developing",
      subject: "MATH",
    });

    assert.equal(p.conceptKey, "PLACE_VALUE");
    assert.match(p.activity, /focused place-value practice/i);
    assert.equal(p.duration, "10 minutes");
    assert.equal(p.recommendationType, "Focused Practice");
    assert.equal(p.remedialPlanEligible, true);
  });

  it("Test 3: Place Value (Mastered) prescribes retrieval practice and retention monitoring", () => {
    const p = generatePedagogicalPrescription({
      conceptName: "Place Value",
      status: "Mastered",
      subject: "MATH",
    });

    assert.equal(p.conceptKey, "PLACE_VALUE");
    assert.match(p.activity, /retrieval practice/i);
    assert.match(p.reason, /without unnecessary remediation/i);
    assert.match(p.reassessment, /monitor retention/i);
    assert.equal(p.recommendationType, "Mastery Maintenance");
    assert.equal(p.remedialPlanEligible, false);
    assert.equal(p.planStatusLabel, "Mastery achieved — continue periodic retrieval practice.");
  });

  it("Test 4: 3-Digit Addition (Needs Support) prescribes guided regrouping with base-10 blocks", () => {
    const p = generatePedagogicalPrescription({
      conceptName: "3-Digit Addition with Regrouping",
      status: "Needs Support",
      subject: "MATH",
    });

    assert.equal(p.conceptKey, "ADDITION_REGROUPING");
    assert.match(p.activity, /base-10 blocks/i);
    assert.match(p.activity, /regrouping across tens and hundreds/i);
    assert.match(p.reason, /visual regrouping helps students understand/i);
    assert.equal(p.duration, "10–15 minutes");
    assert.match(p.reassessment, /regrouping/i);
    assert.equal(p.recommendationType, "Remedial Practice");
    assert.equal(p.remedialPlanEligible, true);
  });

  it("Test 5: Multiplication Tables (Developing) prescribes arrays, skip counting and retrieval practice", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-mult-01",
      conceptName: "Multiplication Tables (2 to 9)",
      status: "Developing",
      subject: "MATH",
    });

    assert.equal(p.conceptKey, "MULTIPLICATION_TABLES");
    assert.match(p.activity, /skip counting/i);
    assert.match(p.activity, /equal groups/i);
    assert.match(p.activity, /arrays/i);
    assert.match(p.activity, /retrieval-practice questions/i);
    assert.match(p.reason, /repeated retrieval and visual grouping/i);
    assert.equal(p.duration, "5–10 minutes");
    assert.match(p.reassessment, /multiplication questions/i);
    assert.equal(p.recommendationType, "Focused Practice");
    assert.equal(p.remedialPlanEligible, true);
  });

  it("Test 6: Division (Needs Support) prescribes physical equal-sharing activity", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-div-01",
      conceptName: "Division Basics & Equal Sharing",
      status: "Needs Support",
      subject: "MATH",
    });

    assert.equal(p.conceptKey, "DIVISION_EQUAL_SHARING");
    assert.match(p.activity, /counters or blocks/i);
    assert.match(p.activity, /equal groups/i);
    assert.match(p.activity, /distribute objects equally/i);
    assert.match(p.reason, /concrete equal-sharing activities connect the meaning of division/i);
    assert.equal(p.duration, "10 minutes");
    assert.match(p.reassessment, /equal-sharing problems/i);
    assert.equal(p.recommendationType, "Remedial Practice");
    assert.equal(p.remedialPlanEligible, true);
  });

  it("Test 7: Reading Comprehension (Needs Support) prescribes passage and evidence-finding questions", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-eng-comp-01",
      conceptName: "Short Passage Reading Comprehension",
      status: "Needs Support",
      subject: "ENG",
    });

    assert.equal(p.conceptKey, "READING_COMPREHENSION");
    assert.match(p.activity, /age-appropriate passage/i);
    assert.match(p.activity, /who, what, where, and why questions/i);
    assert.match(p.activity, /sentence or detail supporting each answer/i);
    assert.match(p.reason, /questioning and evidence-finding practice develop understanding/i);
    assert.equal(p.duration, "10–15 minutes");
    assert.match(p.reassessment, /new short passage/i);
    assert.equal(p.recommendationType, "Remedial Practice");
    assert.equal(p.remedialPlanEligible, true);
  });

  it("Test 8: Water Cycle (Developing) prescribes labelled sequence and verbal explanation", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-evs-water-01",
      conceptName: "Water Cycle & Conservation",
      status: "Developing",
      subject: "EVS",
    });

    assert.equal(p.conceptKey, "WATER_CYCLE");
    assert.match(p.activity, /labelled visual sequence/i);
    assert.match(p.activity, /evaporation, condensation, and precipitation/i);
    assert.match(p.activity, /explain each stage in their own words/i);
    assert.match(p.reason, /visual sequencing and verbal explanation/i);
    assert.equal(p.duration, "10 minutes");
    assert.match(p.reassessment, /arrange the stages in the correct sequence/i);
    assert.equal(p.recommendationType, "Focused Practice");
    assert.equal(p.remedialPlanEligible, true);
  });

  it("Test 9: Any supported concept (Mastered) prescribes mastery maintenance, not remediation", () => {
    const concepts = [
      { id: "c-div-01", name: "Division" },
      { id: "c-mult-01", name: "Multiplication Tables" },
      { id: "c-place-01", name: "Place Value" },
      { id: "c-eng-comp-01", name: "Reading Comprehension" },
      { id: "c-evs-water-01", name: "Water Cycle" },
      { id: "c-frac-01", name: "Fractions" },
      { id: "c-eng-verb-01", name: "Subject-Verb Agreement" },
    ];

    for (const c of concepts) {
      const p = generatePedagogicalPrescription({
        conceptId: c.id,
        conceptName: c.name,
        status: "Mastered",
      });

      assert.equal(p.recommendationType, "Mastery Maintenance", `Concept ${c.name} must be Mastery Maintenance`);
      assert.equal(p.remedialPlanEligible, false, `Concept ${c.name} must not be remedial plan eligible`);
      assert.match(p.planStatusLabel, /Mastery achieved — continue periodic retrieval practice/i);
      assert.doesNotMatch(p.planStatusLabel, /Ready for 5-Step/i);
      assert.doesNotMatch(p.activity, /remedial plan/i);
    }
  });

  it("Test 10: Unsupported concept handles safely with subject diagnostic fallback", () => {
    const pMath = generatePedagogicalPrescription({
      conceptName: "Quantum Mechanics",
      subject: "MATH",
      status: "Needs Support",
    });
    assert.equal(pMath.conceptKey, "UNKNOWN_CONCEPT");
    assert.equal(pMath.recommendationType, "Diagnostic Activity");
    assert.match(pMath.activity, /diagnostic math activity/i);
    assert.match(pMath.reason, /subject-level diagnostic practice/i);

    const pUnknown = generatePedagogicalPrescription({
      conceptName: "Alien Cryptography",
      subject: "UNKNOWN",
      status: "Needs Support",
    });
    assert.equal(pUnknown.conceptKey, "UNKNOWN_CONCEPT");
    assert.equal(pUnknown.recommendationType, "Diagnostic Activity");
    assert.match(pUnknown.reason, /specific prescription cannot yet be generated/i);
  });

  // --------------------------------------------------------------------------
  // Diagnosis-Aware Variations (Section 4)
  // --------------------------------------------------------------------------

  it("Test 11: Conceptual Gap diagnosis emphasizes concrete demonstration without overriding concept", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-eng-comp-01",
      conceptName: "Reading Comprehension",
      status: "Needs Support",
      diagnosisType: "Conceptual Gap",
    });

    assert.equal(p.conceptKey, "READING_COMPREHENSION");
    assert.match(p.activity, /passage/i); // Still reading comprehension
    assert.match(p.reason, /concrete demonstration and student verbal explanation are emphasized/i);
  });

  it("Test 12: Procedural Error diagnosis emphasizes worked examples and step sequencing", () => {
    const p = generatePedagogicalPrescription({
      conceptName: "3-Digit Addition",
      status: "Needs Support",
      diagnosisType: "Procedural Error",
    });

    assert.equal(p.conceptKey, "ADDITION_REGROUPING");
    assert.match(p.reason, /worked examples to scaffold sequential operational execution/i);
  });

  it("Test 13: Possible Careless Error diagnosis provides error-checking checklist", () => {
    const p = generatePedagogicalPrescription({
      conceptName: "Multiplication Tables",
      status: "Developing",
      diagnosisType: "Possible Careless Error",
    });

    assert.equal(p.conceptKey, "MULTIPLICATION_TABLES");
    assert.match(p.reason, /error-checking checklist/i);
    assert.equal(p.duration, "5–10 minutes");
  });

  it("Test 14: Prerequisite Weakness diagnosis notes foundational review", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-div-01",
      conceptName: "Division",
      status: "Needs Support",
      diagnosisType: "Prerequisite Weakness",
    });

    assert.equal(p.conceptKey, "DIVISION_EQUAL_SHARING");
    assert.match(p.reason, /foundational prerequisite/i);
  });

  it("Test 15: Insufficient Evidence diagnosis switches recommendation to Diagnostic Activity", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-place-01",
      conceptName: "Place Value",
      status: "Needs Support",
      diagnosisType: "Insufficient Evidence",
    });

    assert.equal(p.recommendationType, "Diagnostic Activity");
    assert.match(p.activity, /diagnostic task/i);
    assert.match(p.reason, /insufficient to identify the specific cognitive obstacle/i);
  });

  // --------------------------------------------------------------------------
  // Historical Progress Integration (Section 6)
  // --------------------------------------------------------------------------

  it("Test 16: Improving progress trend advises continuing focused practice", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-place-01",
      conceptName: "Place Value",
      status: "Developing",
      previousScore: 55,
      currentScore: 70,
      scoreDelta: 15,
      trend: "Improving",
    });

    assert.match(p.reason, /Progress is improving\. Continue the current focused practice and gradually introduce more challenging examples\./i);
  });

  it("Test 17: Stable progress trend advises trying a different representation", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-mult-01",
      conceptName: "Multiplication Tables",
      status: "Developing",
      previousScore: 75,
      currentScore: 75,
      scoreDelta: 0,
      trend: "Stable",
    });

    assert.match(p.reason, /Progress is stable\. Try a different representation or practice strategy to strengthen understanding\./i);
  });

  it("Test 18: Declining progress trend advises reviewing recent difficulties", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-div-01",
      conceptName: "Division",
      status: "Needs Support",
      previousScore: 85,
      currentScore: 65,
      scoreDelta: -20,
      trend: "Declining",
    });

    assert.match(p.reason, /Recent performance has declined\. Review the concept using guided examples and investigate possible learning difficulties before progressing\./i);
  });

  it("Test 19: First assessment does not assume or fabricate trend", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-evs-water-01",
      conceptName: "Water Cycle",
      status: "Developing",
      currentScore: 68,
      previousScore: null,
      trend: undefined,
    });

    assert.doesNotMatch(p.reason, /Progress is improving/i);
    assert.doesNotMatch(p.reason, /Progress is stable/i);
    assert.doesNotMatch(p.reason, /Recent performance has declined/i);
  });

  // --------------------------------------------------------------------------
  // All Demo Store Competencies
  // --------------------------------------------------------------------------

  it("Test 20: Correctly identifies and maps all demo store competencies", () => {
    const demoCompetencies = [
      { id: "c-div-01", name: "Division Basics & Equal Sharing", expected: "DIVISION_EQUAL_SHARING" },
      { id: "c-mult-01", name: "Multiplication Tables (2 to 9)", expected: "MULTIPLICATION_TABLES" },
      { id: "c-place-01", name: "Place Value & 3-Digit Addition", expected: "PLACE_VALUE" },
      { id: "c-frac-01", name: "Fractions Introduction (Half, Quarter)", expected: "FRACTIONS" },
      { id: "c-eng-blend-01", name: "Phonetic Blends (ch, sh, th, wh)", expected: "PHONETIC_BLENDS" },
      { id: "c-eng-comp-01", name: "Short Passage Reading Comprehension", expected: "READING_COMPREHENSION" },
      { id: "c-eng-verb-01", name: "Subject-Verb Agreement", expected: "SUBJECT_VERB_AGREEMENT" },
      { id: "c-guj-matra-01", name: "કાનો-માત્રા અને દીર્ઘ-હ્રસ્વ સ્વર ચિહ્નો (Gujarati Matras)", expected: "GUJARATI_MATRAS" },
      { id: "c-guj-conj-01", name: "જોડાક્ષર શબ્દોનું વાંચન-લેખન (Gujarati Conjuncts)", expected: "GUJARATI_CONJUNCTS" },
      { id: "c-evs-water-01", name: "Water Cycle & Conservation", expected: "WATER_CYCLE" },
      { id: "c-evs-plant-01", name: "Parts of Plants & Their Functions", expected: "PLANT_PARTS" },
      { id: "c-evs-comm-01", name: "Community Helpers & Sanitation", expected: "COMMUNITY_HELPERS" },
    ];

    for (const c of demoCompetencies) {
      const key = identifyConceptKey(c.id, c.name);
      assert.equal(key, c.expected, `Concept ${c.name} mapped to ${key}, expected ${c.expected}`);
      const p = generatePedagogicalPrescription({
        conceptId: c.id,
        conceptName: c.name,
        status: "Needs Support",
      });
      assert.ok(p.activity.length > 10);
      assert.ok(p.reason.length > 10);
      assert.ok(p.duration.length > 0);
      assert.ok(p.reassessment.length > 10);
    }
  });

  // --------------------------------------------------------------------------
  // Gujarati Localization
  // --------------------------------------------------------------------------

  it("Test 21: Accurately localizes prescriptions and status labels into Gujarati", () => {
    const p = generatePedagogicalPrescription({
      conceptId: "c-div-01",
      conceptName: "Division Basics & Equal Sharing",
      status: "Needs Support",
      language: "gu",
    });

    assert.equal(p.conceptKey, "DIVISION_EQUAL_SHARING");
    assert.match(p.activity, /સમાન જૂથો બનાવવા માટે/);
    assert.match(p.reason, /મૂર્ત સમાન વહેંચણી પ્રવૃત્તિઓ/);
    assert.equal(p.duration, "૧૦ મિનિટ");
    assert.match(p.reassessment, /સમાન વહેંચણીની સમસ્યાઓ/);
    assert.equal(p.recommendationTypeGu, "ઉપચારાત્મક મહાવરો");
    assert.equal(p.planStatusLabelGu, "૫-પગલાં પ્રવૃત્તિ આધારિત ઉપચાર માટે તૈયાર");

    const pMastered = generatePedagogicalPrescription({
      conceptId: "c-div-01",
      status: "Mastered",
      language: "gu",
    });
    assert.equal(pMastered.planStatusLabelGu, "નિપુણતા પ્રાપ્ત થઈ — સામયિક પુનરાવર્તન જાળવો.");
    assert.equal(pMastered.recommendationTypeGu, "નિપુણતા જાળવણી");
  });
});

