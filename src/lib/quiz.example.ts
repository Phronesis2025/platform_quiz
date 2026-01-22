/**
 * Example usage of the quiz module
 * 
 * This file demonstrates how to use the quiz data and scoring function.
 * It's not part of the main application but serves as documentation.
 */

import {
  ROLES,
  QUESTIONS,
  scoreResponses,
  type QuizResponses,
  type ScoringResult,
} from "./quiz";

// Example: Display all role definitions
console.log("Available Roles:");
Object.values(ROLES).forEach((role) => {
  console.log(`- ${role.label} (${role.id}): ${role.explanation}`);
});

// Example: Display all questions
console.log("\nQuiz Questions:");
QUESTIONS.forEach((question) => {
  console.log(`\nQuestion ${question.id} (${question.type}):`);
  console.log(`  Prompt: ${question.prompt}`);
  console.log(`  Options: ${question.options.join(", ")}`);
});

// Example: Score sample responses
const sampleResponses: QuizResponses = {
  1: 2, // Forced choice: selected option index 2
  2: [0, 2, 4], // Multiple choice: selected options 0, 2, and 4
  3: 4, // Likert: selected option index 4 (Extremely important)
  4: 0, // Forced choice: selected option index 0
  5: 3, // Likert: selected option index 3 (High interest)
  6: 1, // Forced choice: selected option index 1
  7: [1, 3, 5], // Multiple choice: selected options 1, 3, and 5
  8: 4, // Likert: selected option index 4 (Very comfortable)
  9: 2, // Forced choice: selected option index 2
  10: [2, 4], // Multiple choice: selected options 2 and 4
};

const result: ScoringResult = scoreResponses(sampleResponses);

console.log("\n=== Scoring Results ===");
console.log("\nTotals per Role:");
Object.entries(result.totals).forEach(([roleId, score]) => {
  const role = ROLES[roleId as keyof typeof ROLES];
  console.log(`  ${role.label}: ${score} points`);
});

console.log("\nRanked Results:");
result.ranked.forEach((rankedRole) => {
  const role = ROLES[rankedRole.roleId];
  console.log(
    `  Rank ${rankedRole.rank}: ${role.label} (${rankedRole.score} points)`
  );
});

// Handle primary role (can be single role or "Role1 + Role2" format)
if (typeof result.primaryRole === "string" && result.primaryRole.includes(" + ")) {
  const [role1, role2] = result.primaryRole.split(" + ") as [keyof typeof ROLES, keyof typeof ROLES];
  console.log(`\nPrimary Role: ${ROLES[role1].label} + ${ROLES[role2].label}`);
} else {
  console.log(`\nPrimary Role: ${ROLES[result.primaryRole as keyof typeof ROLES].label}`);
}
if (result.secondaryRole) {
  console.log(`Secondary Role: ${ROLES[result.secondaryRole].label}`);
}
console.log(`Tie Detected: ${result.tieDetected}`);

console.log("\nNarrative Summary:");
console.log(result.narrative);
