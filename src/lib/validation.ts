import { z } from "zod";
import { QUESTIONS, BONUS_QUESTIONS } from "./quiz";

/**
 * Zod schema for validating quiz submissions
 *
 * This ensures:
 * - All required fields are present
 * - All questions are answered
 * - Response types match question types
 * - Option indices are valid
 */

// Schema for a single question response
// Can be a number (for forced_choice/likert) or array of numbers (for multiple_choice, max 2)
const questionResponseSchema = z.union([
  z.number().int().nonnegative(),
  z.array(z.number().int().nonnegative()).min(1).max(2),
]);

// Get all possible questions (core + bonus) for validation
const ALL_QUESTIONS = [...QUESTIONS, ...BONUS_QUESTIONS];

// Schema for the complete quiz responses
// Must include all core question IDs, and optionally bonus question IDs
const quizResponsesSchema = z
  .record(
    z.string().transform((val) => parseInt(val, 10)),
    questionResponseSchema,
  )
  .refine(
    (responses) => {
      // Check that all core questions are answered
      const coreQuestionIds = QUESTIONS.map((q) => q.id);
      const responseIds = Object.keys(responses).map((id) => parseInt(id, 10));

      // All core question IDs must be present in responses
      return coreQuestionIds.every((id) => responseIds.includes(id));
    },
    {
      message: "All core questions must be answered",
    },
  )
  .refine(
    (responses) => {
      // Validate that each response matches its question type
      // Check both core and bonus questions that are present
      const responseIds = Object.keys(responses).map((id) => parseInt(id, 10));

      for (const questionId of responseIds) {
        const question = ALL_QUESTIONS.find((q) => q.id === questionId);
        if (!question) {
          // Unknown question ID (shouldn't happen, but be lenient)
          continue;
        }

        const response = responses[questionId];
        if (response === undefined) {
          continue;
        }

        if (question.type === "multiple_choice") {
          // Multiple choice must be an array
          if (!Array.isArray(response)) {
            return false;
          }
          // All selected indices must be valid
          if (
            response.some((idx) => idx < 0 || idx >= question.options.length)
          ) {
            return false;
          }
          // Must select at least one option
          if (response.length === 0) {
            return false;
          }
          // Must select at most 2 options (Select up to 2)
          if (response.length > 2) {
            return false;
          }
        } else {
          // Forced choice and likert must be a single number
          if (typeof response !== "number") {
            return false;
          }
          // Index must be valid
          if (response < 0 || response >= question.options.length) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: "Invalid response format or out-of-range option indices",
    },
  );

// Schema for the complete submission request
export const submissionRequestSchema = z
  .object({
    responses: quizResponsesSchema,
    name: z.string().trim().max(255).optional().nullable(),
    team: z.string().trim().max(255).optional().nullable(),
    bonusQuestionsShown: z.array(z.number().int().positive()).optional(), // IDs of bonus questions that were shown
  })
  .strict(); // Reject any extra fields

export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;
