import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeRootCause,
  getAllPrerequisites,
  getAllDependents,
  resolveConceptNode,
  CONCEPT_DEPENDENCY_GRAPH,
} from "./prerequisiteEngine";

test("Prerequisite & Root-Cause Analysis Engine - Comprehensive Test Suite", async (t) => {
  await t.test("1. Concept Dependency Graph: models Place Value and Multi-Digit Addition chain correctly", () => {
    const node = resolveConceptNode("c-place-01");
    assert.ok(node);
    assert.equal(node.name, "3-Digit Addition");

    const prereqs = getAllPrerequisites("c-place-01");
    const prereqNames = prereqs.map((p) => p.name);

    assert.ok(prereqNames.includes("Ones & Tens"));
    assert.ok(prereqNames.includes("Place Value"));
    assert.ok(prereqNames.includes("Regrouping"));
  });

  await t.test("2. Concept Dependency Graph: models Skip Counting -> Multiplication Tables -> Division chain correctly", () => {
    const divNode = resolveConceptNode("c-div-01");
    assert.ok(divNode);
    assert.equal(divNode.name, "Division");

    const prereqs = getAllPrerequisites("c-div-01");
    const prereqNames = prereqs.map((p) => p.name);

    assert.ok(prereqNames.includes("Skip Counting"));
    assert.ok(prereqNames.includes("Multiplication Tables"));
  });

  await t.test("3. Root-Cause Identification: 3-Digit Addition difficulty with Regrouping error pattern identifies Place Value / Regrouping as Root Gap", () => {
    const result = analyzeRootCause({
      affectedConceptId: "c-place-01",
      affectedConceptName: "Place Value & 3-Digit Addition",
      studentScore: 50,
      errorPattern: "Repeated regrouping errors in column addition",
      questionEvidence: [
        {
          questionText: "Calculate 248 + 175",
          studentResponse: "313",
          correctResponse: "423",
          detectedError: "Omitted tens and hundreds carrying during regrouping",
        },
      ],
      prerequisitesMastered: false,
    });

    assert.equal(result.isRootGapIdentified, true);
    assert.ok(result.rootConcept);
    assert.equal(result.rootConcept?.name, "Regrouping");
    assert.equal(result.affectedConcept.name, "3-Digit Addition");
    assert.ok(result.rootCauseConfidence >= 0.85);
    assert.equal(result.rootCauseConfidenceLevel, "High");

    // Recommended learning path contains Regrouping before 3-Digit Addition
    assert.deepEqual(result.recommendedLearningOrder, [
      "Regrouping",
      "3-Digit Addition",
    ]);

    // Check learning path steps
    const rootStep = result.learningPath.find((s: any) => s.isRoot);
    assert.ok(rootStep);
    assert.equal(rootStep?.conceptName, "Regrouping");
    assert.equal(rootStep?.status, "Root Gap");

    const targetStep = result.learningPath.find((s: any) => s.isTarget);
    assert.ok(targetStep);
    assert.equal(targetStep?.conceptName, "3-Digit Addition");
    assert.equal(targetStep?.status, "Target Gap");
  });

  await t.test("4. Root-Cause Identification: Division difficulty caused by unmastered Multiplication Tables", () => {
    const result = analyzeRootCause({
      affectedConceptId: "c-div-01",
      affectedConceptName: "Division Basics & Equal Sharing",
      studentScore: 35,
      studentHistory: [
        {
          conceptId: "c-mult-01",
          conceptName: "Multiplication Tables",
          score: 42,
          passed: false,
        },
      ],
      prerequisitesMastered: false,
    });

    assert.equal(result.isRootGapIdentified, true);
    assert.ok(result.rootConcept);
    assert.equal(result.rootConcept?.name, "Multiplication Tables");
    assert.equal(result.affectedConcept.name, "Division");
    assert.ok(result.rootCauseConfidence >= 0.9);
    assert.equal(result.rootCauseConfidenceLevel, "High");
    assert.match(result.rootCauseExplanation, /unmastered prerequisite in Multiplication Tables/i);

    // Recommended learning order
    assert.ok(result.recommendedLearningOrder.includes("Multiplication Tables"));
    assert.ok(result.recommendedLearningOrder.includes("Division"));
  });

  await t.test("5. Direct Concept Gap: Prerequisites verified mastered does NOT assign a false prerequisite root cause", () => {
    const result = analyzeRootCause({
      affectedConceptId: "c-place-01",
      affectedConceptName: "3-Digit Addition",
      studentScore: 58,
      prerequisitesMastered: true,
      studentHistory: [
        {
          conceptId: "c-math-ones-tens",
          conceptName: "Ones & Tens",
          score: 92,
          passed: true,
        },
        {
          conceptId: "c-math-pv-2",
          conceptName: "Place Value",
          score: 88,
          passed: true,
        },
        {
          conceptId: "c-math-regroup",
          conceptName: "Regrouping",
          score: 85,
          passed: true,
        },
      ],
    });

    assert.equal(result.isRootGapIdentified, false);
    assert.equal(result.rootConcept, undefined);
    assert.equal(result.affectedConcept.name, "3-Digit Addition");
    assert.match(result.rootCauseExplanation, /All foundational prerequisites.*verified mastered/i);
  });

  await t.test("6. Insufficient Evidence: Does NOT fabricate root cause when assessment history is absent", () => {
    const result = analyzeRootCause({
      affectedConceptId: "c-place-01",
      affectedConceptName: "3-Digit Addition",
      studentScore: 55,
      // No student history, no error patterns, prerequisitesMastered undefined
      studentHistory: [],
    });

    assert.equal(result.isRootGapIdentified, false);
    assert.equal(result.rootConcept, undefined);
    assert.equal(result.rootCauseConfidenceLevel, "Low");
    assert.ok(result.insufficientEvidenceWarning);
    assert.match(result.insufficientEvidenceWarning || "", /run a short 3-question prerequisite diagnostic/i);
  });

  await t.test("7. Downstream Dependent Concepts: returns correct concepts that build on Place Value", () => {
    const dependents = getAllDependents("c-math-pv-2");
    const names = dependents.map((d) => d.name);
    assert.ok(names.includes("Regrouping"));
    assert.ok(names.includes("3-Digit Addition"));
  });
});
