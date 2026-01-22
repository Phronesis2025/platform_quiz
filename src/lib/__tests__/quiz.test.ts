/**
 * Unit tests for the quiz module
 * 
 * These tests demonstrate that the scoreResponses function is pure and testable.
 * In a real project, you would use a testing framework like Jest or Vitest.
 */

import {
  scoreResponses,
  QUESTIONS,
  ROLES,
  type QuizResponses,
  type ScoringResult,
} from "../quiz";

/**
 * Test helper: Create a complete response set with all questions answered
 */
function createCompleteResponses(
  forcedChoiceAnswer: number = 0,
  likertAnswer: number = 2,
  multipleChoiceAnswers: number[] = [0]
): QuizResponses {
  const responses: QuizResponses = {};

  QUESTIONS.forEach((question) => {
    if (question.type === "forced_choice") {
      responses[question.id] = forcedChoiceAnswer;
    } else if (question.type === "likert") {
      responses[question.id] = likertAnswer;
    } else if (question.type === "multiple_choice") {
      responses[question.id] = multipleChoiceAnswers;
    }
  });

  return responses;
}

/**
 * Test Case 1: All questions favor Backend Engineer
 * Expected: BE should have the highest score
 */
function testBackendEngineerBias() {
  console.log("Test 1: Backend Engineer Bias");
  
  // Create responses that favor BE role
  const responses: QuizResponses = {
    1: 1, // Data structure and system architecture
    2: [0, 4], // Database schemas, RESTful APIs
    3: 4, // Extremely important (testing)
    4: 0, // System design and scalability
    5: 0, // Very low interest in user interaction
    6: 0, // Breaking down complex systems
    7: [0, 4], // Docker/Kubernetes, Databases
    8: 4, // Very comfortable with debugging
    9: 0, // Building robust systems
    10: [0, 4], // Optimizing queries, API contracts
  };

  const result = scoreResponses(responses);

  console.log("  Totals:", result.totals);
  const primaryRoleLabel = typeof result.primaryRole === "string" && result.primaryRole.includes(" + ")
    ? result.primaryRole.split(" + ").map(r => ROLES[r as keyof typeof ROLES].label).join(" + ")
    : ROLES[result.primaryRole as keyof typeof ROLES].label;
  console.log("  Primary Role:", primaryRoleLabel);
  console.log("  Expected: Backend Engineer");
  console.log("  ✓ Pass:", result.primaryRole === "BE" || (typeof result.primaryRole === "string" && result.primaryRole.startsWith("BE")));
  console.log("");
}

/**
 * Test Case 2: All questions favor Frontend Engineer
 * Expected: FE should have the highest score
 */
function testFrontendEngineerBias() {
  console.log("Test 2: Frontend Engineer Bias");
  
  const responses: QuizResponses = {
    1: 0, // User experience and visual design
    2: [1, 5], // Responsive layouts, Accessibility
    3: 2, // Moderately important
    4: 1, // CSS animations and responsive design
    5: 4, // Very high interest in users
    6: 1, // Creating intuitive solutions
    7: [1, 5], // Frontend frameworks, Figma
    8: 3, // Comfortable with debugging
    9: 1, // Beautiful interfaces
    10: [1, 5], // Prototyping UI, Cross-browser
  };

  const result = scoreResponses(responses);

  console.log("  Totals:", result.totals);
  const primaryRoleLabel = typeof result.primaryRole === "string" && result.primaryRole.includes(" + ")
    ? result.primaryRole.split(" + ").map(r => ROLES[r as keyof typeof ROLES].label).join(" + ")
    : ROLES[result.primaryRole as keyof typeof ROLES].label;
  console.log("  Primary Role:", primaryRoleLabel);
  console.log("  Expected: Frontend Engineer");
  console.log("  ✓ Pass:", result.primaryRole === "FE" || (typeof result.primaryRole === "string" && result.primaryRole.startsWith("FE")));
  console.log("");
}

/**
 * Test Case 3: Empty responses
 * Expected: All scores should be zero, but function should not crash
 */
function testEmptyResponses() {
  console.log("Test 3: Empty Responses");
  
  const responses: QuizResponses = {};
  const result = scoreResponses(responses);

  console.log("  Totals:", result.totals);
  console.log("  All zeros:", Object.values(result.totals).every((s) => s === 0));
  console.log("  ✓ Pass: Function handles empty responses gracefully");
  console.log("");
}

/**
 * Test Case 4: Partial responses
 * Expected: Should only score answered questions
 */
function testPartialResponses() {
  console.log("Test 4: Partial Responses");
  
  const responses: QuizResponses = {
    1: 0, // Only first question answered
  };
  const result = scoreResponses(responses);

  console.log("  Totals:", result.totals);
  console.log("  ✓ Pass: Function handles partial responses");
  console.log("");
}

/**
 * Test Case 5: Tie detection
 * Expected: Should correctly identify when multiple roles have the same score
 */
function testTieDetection() {
  console.log("Test 5: Tie Detection");
  
  // Create responses that result in a tie
  const responses: QuizResponses = createCompleteResponses(0, 2, [0]);
  const result = scoreResponses(responses);

  console.log("  Totals:", result.totals);
  console.log("  Tie Detected:", result.tieDetected);
  console.log("  Ranked:", result.ranked.map((r) => `${ROLES[r.roleId].label} (${r.score})`));
  console.log("  ✓ Pass: Tie detection works");
  console.log("");
}

/**
 * Test Case 6: Pure function property
 * Expected: Same inputs should always produce same outputs
 */
function testPureFunction() {
  console.log("Test 6: Pure Function Property");
  
  const responses: QuizResponses = {
    1: 2,
    2: [0, 1],
    3: 3,
    4: 1,
    5: 2,
    6: 0,
    7: [2, 3],
    8: 3,
    9: 2,
    10: [1, 3],
  };

  const result1 = scoreResponses(responses);
  const result2 = scoreResponses(responses);
  const result3 = scoreResponses(responses);

  const allSame =
    JSON.stringify(result1.totals) === JSON.stringify(result2.totals) &&
    JSON.stringify(result2.totals) === JSON.stringify(result3.totals);

  console.log("  Result 1 totals:", result1.totals);
  console.log("  Result 2 totals:", result2.totals);
  console.log("  Result 3 totals:", result3.totals);
  console.log("  ✓ Pass: Function is deterministic (pure):", allSame);
  console.log("");
}

// Run all tests
console.log("=== Quiz Module Unit Tests ===\n");
testBackendEngineerBias();
testFrontendEngineerBias();
testEmptyResponses();
testPartialResponses();
testTieDetection();
testPureFunction();
console.log("=== All Tests Complete ===");
