/**
 * TypeScript types for quiz submissions stored in Redis
 *
 * Redis stores submissions as JSON strings with the following structure.
 * We use a key pattern: "submission:{id}" for individual submissions
 * and a sorted set "submissions:index" for ordering by creation date.
 */

/**
 * Submission data structure stored in Redis
 */
export interface Submission {
  // Primary key: UUID
  id: string;

  // Timestamp when the submission was created (ISO string)
  createdAt: string;

  // Optional user information
  name: string | null;
  team: string | null;

  // Quiz responses: JSON object mapping question IDs to responses
  answers: Record<string, unknown>;

  // Scoring totals: JSON object with role scores
  totals: Record<string, number>;

  // Ranked roles: JSON array of ranked role results
  rankedRoles: Array<{ roleId: string; score: number; rank: number }>;

  // Primary role (can be single role ID or "Role1 + Role2" format)
  primaryRole: string;

  // Secondary role (optional)
  secondaryRole: string | null;

  // Narrative summary text
  summaryText: string;

  // Skill profile: accumulated skill tags from all selected options
  // Optional for backward compatibility with old submissions
  skillProfile?: {
    tags: string[];
    tagFrequency: Record<string, number>;
  };

  // Evidence highlights: top 3-5 strongest signal answers with evidence
  // Optional for backward compatibility with old submissions
  evidenceHighlights?: Array<{
    questionId: number;
    questionPrompt: string;
    optionText: string;
    evidence: string;
    signals: string[];
    score: number;
  }>;

  // Primary role recommendations (from role playbook bestUsedFor)
  // Optional for backward compatibility with old submissions
  primaryRecommendations?: string[];

  // Secondary role recommendations (from secondary role playbook bestUsedFor, if applicable)
  // Optional for backward compatibility with old submissions
  secondaryRecommendations?: string[];

  // Enhanced scoring metrics
  // Optional for backward compatibility with old submissions
  dominanceScore?: number; // Difference between top and second place scores
  confidenceBand?: "Strong" | "Clear" | "Split" | "Hybrid"; // Confidence level of role assignment
  bonusQuestionsShown?: number[]; // IDs of bonus questions that were shown

  // Optional metadata
  userAgent: string | null;
  ipHash: string | null; // SHA-256 hash of IP address
}

/**
 * Type for creating a new submission (without id and createdAt)
 */
export type NewSubmission = Omit<Submission, "id" | "createdAt">;

/**
 * Redis key patterns used in this application:
 * - "submission:{id}" - Individual submission data (JSON string)
 * - "submissions:index" - Sorted set with submission IDs and timestamps (for ordering)
 */
