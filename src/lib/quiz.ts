/**
 * Quiz Module
 *
 * This module contains role definitions, quiz questions, and scoring logic.
 * All data is structured for easy analysis and the scoring function is pure and testable.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Role identifier type
 */
export type RoleId = "BE" | "FE" | "QA" | "PM";

/**
 * Question type identifiers
 */
export type QuestionType = "forced_choice" | "multiple_choice" | "likert";

/**
 * Role definition with user-friendly information
 */
export interface Role {
  id: RoleId;
  label: string;
  explanation: string;
}

/**
 * Scoring map for a single option
 * Maps each role to a numeric score (can be positive or negative)
 */
export type OptionScoring = Record<RoleId, number>;

/**
 * Option metadata with skill signals and evidence
 */
export interface OptionMetadata {
  signals: string[]; // Array of short skill tags (e.g. "Root-cause thinking", "User empathy")
  evidence: string; // One sentence explaining what this choice implies (user-friendly, not judgmental)
}

/**
 * Quiz question structure
 */
export interface Question {
  id: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  scoring: OptionScoring[]; // Array index corresponds to options array index
  optionMetadata: OptionMetadata[]; // Array index corresponds to options array index
}

/**
 * User response to a question
 * For forced_choice: single number (option index)
 * For multiple_choice: array of numbers (option indices)
 * For likert: single number (option index representing scale value)
 */
export type QuestionResponse = number | number[];

/**
 * Complete quiz responses
 * Maps question ID to response
 */
export type QuizResponses = Record<number, QuestionResponse>;

/**
 * Role score totals
 */
export type RoleScores = Record<RoleId, number>;

/**
 * Ranked role result
 */
export interface RankedRole {
  roleId: RoleId;
  score: number;
  rank: number;
}

/**
 * Skill profile containing accumulated skill tags
 */
export interface SkillProfile {
  tags: string[]; // Array of unique skill tags from selected options
  tagFrequency: Record<string, number>; // Frequency count of each tag
}

/**
 * Evidence highlight from a strong-signal answer
 */
export interface EvidenceHighlight {
  questionId: number;
  questionPrompt: string;
  optionText: string;
  evidence: string;
  signals: string[];
  score: number; // The score value that made this a strong signal (+2 or +3)
}

/**
 * Confidence band indicating how clear the role assignment is
 * - Strong: Clear winner with high dominance (≥6 points difference)
 * - Clear: Clear winner with moderate dominance (3-5 points difference)
 * - Split: Close scores, may indicate hybrid strengths (≤2 points difference)
 * - Hybrid: Tied roles or very balanced profile
 */
export type ConfidenceBand = "Strong" | "Clear" | "Split" | "Hybrid";

/**
 * Scoring result containing all calculated data
 */
export interface ScoringResult {
  totals: RoleScores;
  ranked: RankedRole[];
  primaryRole: RoleId | string; // Can be single role or "Role1 + Role2" format for ties
  secondaryRole?: RoleId; // Secondary role when applicable
  tieDetected: boolean;
  narrative: string;
  skillProfile: SkillProfile; // Accumulated skill tags from all selected options
  evidenceHighlights: EvidenceHighlight[]; // Top 3-5 strongest signal answers with evidence
  dominanceScore: number; // Difference between top and second place scores
  confidenceBand: ConfidenceBand; // Confidence level of the role assignment
  bonusQuestionsShown?: number[]; // IDs of bonus questions that were shown
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * Role definitions with user-friendly labels and explanations
 */
export const ROLES: Record<RoleId, Role> = {
  BE: {
    id: "BE",
    label: "Backend Engineer",
    explanation:
      "Backend Engineers focus on server-side logic, databases, APIs, and system architecture. " +
      "They work with data processing, security, performance optimization, and ensuring systems " +
      "can scale and handle high loads efficiently.",
  },
  FE: {
    id: "FE",
    label: "Frontend Engineer",
    explanation:
      "Frontend Engineers create user interfaces and user experiences. They work with HTML, CSS, " +
      "JavaScript, and frameworks to build responsive, accessible, and visually appealing " +
      "applications that users interact with directly.",
  },
  QA: {
    id: "QA",
    label: "Quality Assurance Engineer",
    explanation:
      "QA Engineers ensure software quality through testing, bug identification, and validation. " +
      "They create test plans, write automated tests, perform manual testing, and work to " +
      "prevent defects from reaching production.",
  },
  PM: {
    id: "PM",
    label: "Product Manager",
    explanation:
      "Product Managers bridge business needs and technical implementation. They define product " +
      "requirements, prioritize features, coordinate between stakeholders, and ensure products " +
      "deliver value to users while meeting business objectives.",
  },
};

// ============================================================================
// QUIZ QUESTIONS
// ============================================================================

/**
 * Core 10-question set designed to identify role fit with high accuracy
 *
 * Scoring Rationale:
 * - Forced choice questions award +2 points (strong signals) to clearly indicate role preference
 * - Multiple choice questions award +1 point per selection (moderate signals) allowing multi-role strengths
 * - Likert scale questions use +1/+2 scoring based on extremity of agreement/disagreement
 *
 * Question design focuses on:
 * - Pressure situations (Q1, Q2)
 * - Instinctive responses (Q2, Q5, Q9, Q10)
 * - Risk tolerance (Q3)
 * - Energy sources (Q4, Q6)
 * - Software/tool awareness (Q7)
 * - Production pressure handling (Q8)
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    type: "forced_choice",
    prompt: "A key report is wrong and leadership is waiting.",
    options: [
      "Find the exact point where the logic broke",
      "Clarify impact and reset expectations",
      "Validate results before sharing anything",
      "Adjust presentation so conclusions are clear",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // B → PM
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // D → FE
    ],
    optionMetadata: [
      {
        signals: [
          "Root-cause thinking",
          "System architecture",
          "Technical precision",
        ],
        evidence:
          "You prioritize finding the exact technical issue even under pressure.",
      },
      {
        signals: [
          "Stakeholder management",
          "Impact assessment",
          "Communication",
        ],
        evidence:
          "You focus on managing expectations and clarifying impact before diving deep.",
      },
      {
        signals: ["Quality assurance", "Validation mindset", "Risk mitigation"],
        evidence:
          "You want to ensure accuracy before sharing anything, even when time is tight.",
      },
      {
        signals: ["User empathy", "Presentation clarity", "Usability focus"],
        evidence:
          "You prioritize making the output clear and understandable for leadership.",
      },
    ],
  },
  {
    id: 2,
    type: "forced_choice",
    prompt: "You discover a fix that might affect other areas.",
    options: [
      "Trace dependencies before touching anything",
      "Document and test possible side effects",
      "Coordinate timing and communication",
      "Apply the fix and monitor reactions",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // B → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // C → PM
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // D → FE
    ],
    optionMetadata: [
      {
        signals: ["System thinking", "Dependency analysis", "Technical depth"],
        evidence:
          "You prioritize understanding system dependencies before making changes.",
      },
      {
        signals: ["Quality assurance", "Risk mitigation", "Testing mindset"],
        evidence:
          "You focus on documenting and testing potential side effects before proceeding.",
      },
      {
        signals: ["Coordination", "Communication", "Change management"],
        evidence:
          "You prioritize coordinating timing and communicating impacts to stakeholders.",
      },
      {
        signals: ["Rapid iteration", "User feedback", "Experimental approach"],
        evidence: "You prefer to apply changes and monitor how users react.",
      },
    ],
  },
  {
    id: 3,
    type: "likert",
    prompt:
      "I'm comfortable shipping improvements even if everything isn't perfectly understood yet.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // SD → QA
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // D → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // N → PM
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // A → FE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // SA → FE
    ],
    optionMetadata: [
      {
        signals: ["Quality-first mindset", "Risk aversion", "Precision focus"],
        evidence: "You prefer to fully understand everything before shipping.",
      },
      {
        signals: ["Quality awareness", "Cautious approach"],
        evidence:
          "You generally prefer understanding before shipping, but can be flexible.",
      },
      {
        signals: ["Balanced perspective", "Context-dependent"],
        evidence: "You balance speed and understanding based on the situation.",
      },
      {
        signals: ["Iteration preference", "Speed tolerance", "User feedback"],
        evidence:
          "You're comfortable shipping and learning from user feedback.",
      },
      {
        signals: [
          "Rapid iteration",
          "Action-oriented",
          "Learning through doing",
        ],
        evidence:
          "You strongly prefer shipping quickly and iterating based on feedback.",
      },
    ],
  },
  {
    id: 4,
    type: "multiple_choice",
    prompt: "Which activities energize you most? (Select up to 2)",
    options: [
      "Untangling complex logic",
      "Making outputs intuitive",
      "Catching subtle errors",
      "Keeping work aligned and moving",
    ],
    scoring: [
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // Untangling logic → BE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // Making outputs intuitive → FE
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // Catching errors → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // Keeping work aligned → PM
    ],
    optionMetadata: [
      {
        signals: ["Problem-solving", "Systematic thinking", "Technical depth"],
        evidence:
          "You find energy in solving complex logical puzzles and untangling systems.",
      },
      {
        signals: ["User empathy", "Usability focus", "Presentation clarity"],
        evidence:
          "You're energized by making outputs clearer and more intuitive for users.",
      },
      {
        signals: ["Quality assurance", "Attention to detail", "Precision"],
        evidence:
          "You find satisfaction in catching subtle errors others might miss.",
      },
      {
        signals: ["Coordination", "Alignment", "Process management"],
        evidence:
          "You're energized by keeping work organized and moving forward smoothly.",
      },
    ],
  },
  {
    id: 5,
    type: "forced_choice",
    prompt: "You're given vague requirements.",
    options: [
      "Ask what problem we're solving",
      "Explore possible solutions quickly",
      "Define acceptance criteria",
      "Establish priorities and owners",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // B → FE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // D → PM
    ],
    optionMetadata: [
      {
        signals: [
          "Problem-solving",
          "Root-cause thinking",
          "Technical clarity",
        ],
        evidence:
          "You focus on understanding the underlying problem before proposing solutions.",
      },
      {
        signals: [
          "Rapid iteration",
          "Experimental approach",
          "Solution exploration",
        ],
        evidence:
          "You prefer to quickly explore possible solutions through experimentation.",
      },
      {
        signals: [
          "Quality assurance",
          "Validation mindset",
          "Acceptance criteria",
        ],
        evidence:
          "You prioritize defining clear acceptance criteria and validation rules.",
      },
      {
        signals: ["Coordination", "Prioritization", "Stakeholder management"],
        evidence:
          "You focus on establishing priorities and clarifying ownership.",
      },
    ],
  },
  {
    id: 6,
    type: "likert",
    prompt: "I gain energy from direct interaction with end users.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 1, FE: 0, QA: 1, PM: 0 }, // SD → BE / QA
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // N → PM
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // A → FE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // SA → FE
    ],
    optionMetadata: [
      {
        signals: [
          "Technical focus",
          "System-oriented",
          "Preference for technical work",
        ],
        evidence:
          "You prefer working with systems and data rather than direct user interaction.",
      },
      {
        signals: ["Balanced perspective", "Moderate user awareness"],
        evidence: "You have a balanced view on user interaction.",
      },
      {
        signals: ["Stakeholder engagement", "Communication"],
        evidence: "You're open to user interaction when needed.",
      },
      {
        signals: ["User empathy", "User-centered thinking"],
        evidence: "You value understanding user needs directly.",
      },
      {
        signals: ["Strong user empathy", "User advocacy", "Customer focus"],
        evidence:
          "You gain significant energy from direct user interaction and feedback.",
      },
    ],
  },
  {
    id: 7,
    type: "multiple_choice",
    prompt: "Which areas are you most comfortable navigating? (Select up to 2)",
    options: [
      "Data logic, calculations, models",
      "Dashboards, layouts, visual clarity",
      "Validation rules, consistency checks",
      "Access control, workflows, releases",
    ],
    scoring: [
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // Data logic → BE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // Dashboards → FE
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // Validation rules → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // Access control → PM
    ],
    optionMetadata: [
      {
        signals: ["Data modeling", "Technical depth", "System architecture"],
        evidence:
          "You're comfortable working with data structures, calculations, and models.",
      },
      {
        signals: ["User interface", "Visual design", "Presentation"],
        evidence:
          "You enjoy working with dashboards, layouts, and visual clarity.",
      },
      {
        signals: ["Quality assurance", "Validation", "Consistency"],
        evidence: "You value validation rules and consistency checks.",
      },
      {
        signals: ["Process management", "Coordination", "Operational tools"],
        evidence:
          "You're comfortable with access control, workflows, and release processes.",
      },
    ],
  },
  {
    id: 8,
    type: "likert",
    prompt:
      "When something breaks in production, I prefer to take ownership of diagnosing it.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // SD → PM
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // N → QA
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // SA → BE
    ],
    optionMetadata: [
      {
        signals: [
          "Coordination preference",
          "Delegation",
          "Process management",
        ],
        evidence:
          "You prefer coordinating others to diagnose issues rather than doing it yourself.",
      },
      {
        signals: ["Balanced approach", "Context-dependent"],
        evidence: "You have a balanced view on production issue ownership.",
      },
      {
        signals: ["Quality awareness", "Systematic approach"],
        evidence: "You're open to diagnosing issues when needed.",
      },
      {
        signals: ["Technical ownership", "Problem-solving"],
        evidence:
          "You prefer taking ownership of diagnosing production issues.",
      },
      {
        signals: [
          "Strong technical ownership",
          "Production expertise",
          "Crisis management",
        ],
        evidence:
          "You strongly prefer taking ownership of diagnosing production issues.",
      },
    ],
  },
  {
    id: 9,
    type: "forced_choice",
    prompt: "What outcome feels best?",
    options: [
      "Root cause identified and fixed",
      'Users immediately "get it"',
      "No errors reach production",
      "Everyone knows what's happening",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // B → FE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // D → PM
    ],
    optionMetadata: [
      {
        signals: [
          "Technical excellence",
          "Root-cause thinking",
          "Problem-solving",
        ],
        evidence:
          "You find deep satisfaction in identifying and fixing root causes.",
      },
      {
        signals: ["User adoption", "Usability", "User empathy"],
        evidence:
          "You're motivated by seeing users immediately understand and benefit from your work.",
      },
      {
        signals: [
          "Quality assurance",
          "Risk prevention",
          "Preventive thinking",
        ],
        evidence:
          "You take satisfaction in preventing errors from reaching production.",
      },
      {
        signals: ["Communication", "Transparency", "Coordination"],
        evidence:
          "You find satisfaction in ensuring everyone is informed and aligned.",
      },
    ],
  },
  {
    id: 10,
    type: "forced_choice",
    prompt: "If something goes wrong, your biggest frustration is:",
    options: [
      "The logic wasn't understood",
      "Users were confused",
      "It wasn't tested enough",
      "Communication broke down",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // B → FE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // D → PM
    ],
    optionMetadata: [
      {
        signals: [
          "Technical clarity",
          "System understanding",
          "Logic precision",
        ],
        evidence:
          "You're frustrated when the underlying logic or system understanding is missing.",
      },
      {
        signals: ["User empathy", "Usability focus", "User experience"],
        evidence:
          "You're frustrated when users are confused by the output or interface.",
      },
      {
        signals: [
          "Quality assurance",
          "Testing mindset",
          "Preventive thinking",
        ],
        evidence:
          "You're frustrated when proper testing wasn't done before release.",
      },
      {
        signals: ["Communication", "Coordination", "Stakeholder management"],
        evidence:
          "You're frustrated when communication breaks down and people aren't aligned.",
      },
    ],
  },
];

// ============================================================================
// BONUS QUESTION BANK
// ============================================================================

/**
 * Bonus question bank for enhanced accuracy
 *
 * Usage:
 * - Randomly select 2 questions per user, OR
 * - Show when top two roles are within 2 points (tie-breaker)
 *
 * Scoring Rationale:
 * - All bonus questions are Likert scale
 * - +1 for moderate agreement/disagreement
 * - +2 for strong agreement/disagreement (extremes)
 * - Each question targets specific role signals
 */
export const BONUS_QUESTIONS: Question[] = [
  {
    id: 101,
    type: "likert",
    prompt:
      "When investigating an issue, I prefer understanding the full system even if it takes longer.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 1, FE: 0, QA: 1, PM: 0 }, // N → BE / QA
      { BE: 1, FE: 0, QA: 1, PM: 0 }, // A → BE / QA
      { BE: 2, FE: 0, QA: 2, PM: 0 }, // SA → BE / QA
    ],
    optionMetadata: [
      {
        signals: ["Speed preference"],
        evidence: "You prefer faster solutions over deep understanding.",
      },
      {
        signals: ["Pragmatic approach"],
        evidence: "You balance depth with speed.",
      },
      {
        signals: ["System thinking", "Comprehensive analysis"],
        evidence: "You value understanding full systems.",
      },
      {
        signals: ["System thinking", "Comprehensive analysis"],
        evidence: "You prefer understanding full systems.",
      },
      {
        signals: ["Deep system thinking", "Comprehensive analysis"],
        evidence:
          "You strongly prefer understanding the full system before acting.",
      },
    ],
  },
  {
    id: 102,
    type: "likert",
    prompt:
      "I'm comfortable refining solutions based on feedback rather than getting it perfect upfront.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // N → FE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // A → FE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // SA → FE
    ],
    optionMetadata: [
      {
        signals: ["Perfectionism"],
        evidence: "You prefer getting things right the first time.",
      },
      {
        signals: ["Quality focus"],
        evidence: "You prefer some upfront quality.",
      },
      {
        signals: ["Iteration preference"],
        evidence: "You're comfortable refining based on feedback.",
      },
      {
        signals: ["Iteration preference"],
        evidence: "You prefer refining solutions based on feedback.",
      },
      {
        signals: ["Strong iteration preference"],
        evidence: "You strongly prefer iterating based on feedback.",
      },
    ],
  },
  {
    id: 103,
    type: "likert",
    prompt: "I'd rather slow delivery than risk instability.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 1, PM: 1 }, // N → QA / PM
      { BE: 0, FE: 0, QA: 1, PM: 1 }, // A → QA / PM
      { BE: 0, FE: 0, QA: 2, PM: 2 }, // SA → QA / PM
    ],
    optionMetadata: [
      {
        signals: ["Speed preference"],
        evidence: "You prefer faster delivery.",
      },
      {
        signals: ["Balanced approach"],
        evidence: "You balance speed and stability.",
      },
      {
        signals: ["Stability focus"],
        evidence: "You prefer stability over speed.",
      },
      {
        signals: ["Stability focus"],
        evidence: "You prioritize stability over speed.",
      },
      {
        signals: ["Strong stability focus"],
        evidence: "You strongly prioritize stability over speed.",
      },
    ],
  },
  {
    id: 104,
    type: "likert",
    prompt: "I naturally step in to coordinate when things get messy.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // N → PM
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // A → PM
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // SA → PM
    ],
    optionMetadata: [
      {
        signals: ["Individual focus"],
        evidence: "You prefer focusing on your own work.",
      },
      {
        signals: ["Balanced approach"],
        evidence: "You coordinate when needed.",
      },
      {
        signals: ["Coordination"],
        evidence: "You naturally coordinate when things get messy.",
      },
      {
        signals: ["Coordination"],
        evidence: "You step in to coordinate when needed.",
      },
      {
        signals: ["Strong coordination"],
        evidence: "You strongly prefer coordinating when things get messy.",
      },
    ],
  },
  {
    id: 105,
    type: "likert",
    prompt: "I notice small inconsistencies others overlook.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // N → QA
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // A → QA
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // SA → QA
    ],
    optionMetadata: [
      {
        signals: ["Big picture focus"],
        evidence: "You focus on larger patterns.",
      },
      {
        signals: ["Balanced attention"],
        evidence: "You notice details when needed.",
      },
      {
        signals: ["Attention to detail"],
        evidence: "You notice small inconsistencies.",
      },
      {
        signals: ["Attention to detail"],
        evidence: "You're good at spotting inconsistencies.",
      },
      {
        signals: ["Strong attention to detail"],
        evidence: "You strongly notice small inconsistencies others miss.",
      },
    ],
  },
  {
    id: 106,
    type: "likert",
    prompt: "I learn new tools best by experimenting.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // N → FE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // A → FE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // SA → FE
    ],
    optionMetadata: [
      {
        signals: ["Structured learning"],
        evidence: "You prefer structured learning approaches.",
      },
      {
        signals: ["Balanced learning"],
        evidence: "You use various learning methods.",
      },
      {
        signals: ["Experimental learning"],
        evidence: "You learn by experimenting.",
      },
      {
        signals: ["Experimental learning"],
        evidence: "You prefer learning through experimentation.",
      },
      {
        signals: ["Strong experimental learning"],
        evidence: "You strongly prefer learning by experimenting.",
      },
    ],
  },
  {
    id: 107,
    type: "likert",
    prompt:
      "I enjoy working with underlying structures more than surface presentation.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // N → BE
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // SA → BE
    ],
    optionMetadata: [
      {
        signals: ["Presentation focus"],
        evidence: "You prefer working with surface presentation.",
      },
      {
        signals: ["Balanced approach"],
        evidence: "You work with both structures and presentation.",
      },
      {
        signals: ["System thinking"],
        evidence: "You enjoy underlying structures.",
      },
      {
        signals: ["System thinking"],
        evidence: "You prefer underlying structures.",
      },
      {
        signals: ["Strong system thinking"],
        evidence:
          "You strongly prefer underlying structures over presentation.",
      },
    ],
  },
  {
    id: 108,
    type: "likert",
    prompt: "Rolling out changes carefully matters more than speed.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 1, PM: 1 }, // N → QA / PM
      { BE: 0, FE: 0, QA: 1, PM: 1 }, // A → QA / PM
      { BE: 0, FE: 0, QA: 2, PM: 2 }, // SA → QA / PM
    ],
    optionMetadata: [
      {
        signals: ["Speed preference"],
        evidence: "You prefer faster rollouts.",
      },
      {
        signals: ["Balanced approach"],
        evidence: "You balance speed and care.",
      },
      {
        signals: ["Change management"],
        evidence: "You prefer careful rollouts.",
      },
      {
        signals: ["Change management"],
        evidence: "You prioritize careful rollouts.",
      },
      {
        signals: ["Strong change management"],
        evidence: "You strongly prioritize careful rollouts over speed.",
      },
    ],
  },
  {
    id: 109,
    type: "likert",
    prompt: "I enjoy explaining complex ideas simply.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 1, QA: 0, PM: 1 }, // N → FE / PM
      { BE: 0, FE: 1, QA: 0, PM: 1 }, // A → FE / PM
      { BE: 0, FE: 2, QA: 0, PM: 2 }, // SA → FE / PM
    ],
    optionMetadata: [
      {
        signals: ["Technical focus"],
        evidence: "You prefer technical depth over simplification.",
      },
      {
        signals: ["Balanced communication"],
        evidence: "You communicate when needed.",
      },
      {
        signals: ["Communication", "Clarity"],
        evidence: "You enjoy explaining complex ideas simply.",
      },
      {
        signals: ["Communication", "Clarity"],
        evidence: "You value explaining complex ideas simply.",
      },
      {
        signals: ["Strong communication", "Clarity"],
        evidence: "You strongly enjoy explaining complex ideas simply.",
      },
    ],
  },
  {
    id: 110,
    type: "likert",
    prompt: "I often ask 'what could break?'",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // N → QA
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // A → QA
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // SA → QA
    ],
    optionMetadata: [
      {
        signals: ["Optimistic approach"],
        evidence: "You focus on what will work.",
      },
      {
        signals: ["Balanced thinking"],
        evidence: "You consider risks when needed.",
      },
      {
        signals: ["Defensive thinking"],
        evidence: "You often think about what could break.",
      },
      {
        signals: ["Defensive thinking"],
        evidence: "You regularly consider what could break.",
      },
      {
        signals: ["Strong defensive thinking"],
        evidence: "You strongly and frequently ask 'what could break?'",
      },
    ],
  },
  {
    id: 111,
    type: "likert",
    prompt: "I look for ways to improve systems after they work.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // N → BE
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // SA → BE
    ],
    optionMetadata: [
      {
        signals: ["Completion focus"],
        evidence: "You prefer moving to new work after completion.",
      },
      {
        signals: ["Balanced approach"],
        evidence: "You improve systems when needed.",
      },
      {
        signals: ["Optimization"],
        evidence: "You look for ways to improve systems.",
      },
      {
        signals: ["Optimization"],
        evidence: "You actively seek system improvements.",
      },
      {
        signals: ["Strong optimization"],
        evidence: "You strongly and consistently look for system improvements.",
      },
    ],
  },
  {
    id: 112,
    type: "likert",
    prompt: "I'm frustrated when people aren't on the same page.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // SD → neutral
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // D → neutral
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // N → PM
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // A → PM
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // SA → PM
    ],
    optionMetadata: [
      {
        signals: ["Individual focus"],
        evidence: "You're comfortable with people having different views.",
      },
      {
        signals: ["Balanced approach"],
        evidence: "You value alignment but aren't frustrated by differences.",
      },
      {
        signals: ["Alignment focus"],
        evidence: "You're frustrated when people aren't aligned.",
      },
      {
        signals: ["Alignment focus"],
        evidence: "You value having everyone on the same page.",
      },
      {
        signals: ["Strong alignment focus"],
        evidence: "You're strongly frustrated when people aren't aligned.",
      },
    ],
  },
];

// ============================================================================
// BONUS QUESTION SELECTION HELPERS
// ============================================================================

/**
 * Selects bonus questions based on scoring results
 *
 * Strategy:
 * - If top two roles are within 2 points: select 2-3 bonus questions that help differentiate between top roles
 * - Otherwise: deterministically select 2 bonus questions (using seed if provided)
 *
 * Note: Scoring remains deterministic - same responses always produce same scores.
 * Bonus question selection may vary per user, but we store which questions were shown
 * so results can be reproduced.
 *
 * @param totals - Current role score totals (before bonus questions)
 * @param seed - Optional seed for deterministic selection (e.g., user name). If not provided, uses first 2 questions.
 * @returns Array of bonus question IDs to show
 */
export function selectBonusQuestions(
  totals: RoleScores,
  seed?: string,
): number[] {
  // Get top two roles
  const sorted = Object.entries(totals)
    .map(([roleId, score]) => ({ roleId: roleId as RoleId, score }))
    .sort((a, b) => b.score - a.score);

  const topScore = sorted[0].score;
  const secondScore = sorted[1]?.score || 0;
  const scoreDifference = topScore - secondScore;

  // If top two roles are within 2 points, use tie-breaker strategy
  if (scoreDifference <= 2) {
    // Select 2-3 bonus questions that help distinguish between top roles
    const topRoles = [sorted[0].roleId, sorted[1]?.roleId].filter(
      Boolean,
    ) as RoleId[];

    // Find bonus questions that differentiate between these roles
    const differentiatingQuestions = BONUS_QUESTIONS.filter((q) => {
      // Check if this question gives different scores to the top roles
      const hasDifferentiation = q.scoring.some((scoring) => {
        const role1Score = scoring[topRoles[0]];
        const role2Score = topRoles[1] ? scoring[topRoles[1]] : 0;
        return Math.abs(role1Score - role2Score) > 0;
      });
      return hasDifferentiation;
    });

    // If we found differentiating questions, use them (up to 3)
    if (differentiatingQuestions.length > 0) {
      return differentiatingQuestions.slice(0, 3).map((q) => q.id);
    }
  }

  // Otherwise, randomly select 2 bonus questions
  // Use deterministic "random" based on seed if provided
  const availableIds = BONUS_QUESTIONS.map((q) => q.id);
  const selected: number[] = [];

  // Simple deterministic selection based on seed or fallback to first 2
  if (seed) {
    // Use seed to deterministically select (simple hash-based approach)
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index1 = Math.abs(hash) % availableIds.length;
    const index2 = Math.abs(hash * 31) % availableIds.length;
    selected.push(availableIds[index1]);
    if (index2 !== index1) {
      selected.push(availableIds[index2]);
    } else {
      selected.push(availableIds[(index2 + 1) % availableIds.length]);
    }
  } else {
    // Default: select first 2 (deterministic fallback)
    selected.push(...availableIds.slice(0, 2));
  }

  return selected;
}

/**
 * Get all questions (core + selected bonus) for a quiz session
 *
 * @param bonusQuestionIds - IDs of bonus questions to include
 * @returns Combined array of core and bonus questions
 */
export function getQuestionsForSession(bonusQuestionIds: number[]): Question[] {
  const bonusQuestions = BONUS_QUESTIONS.filter((q) =>
    bonusQuestionIds.includes(q.id),
  );
  return [...QUESTIONS, ...bonusQuestions];
}

// ============================================================================
// SCORING FUNCTION
// ============================================================================

/**
 * Pure function to score quiz responses and calculate role fit
 *
 * This function is deterministic, has no side effects, and is fully testable.
 * It processes all responses, calculates scores per role, ranks them, handles ties,
 * and generates a narrative summary.
 *
 * @param responses - Object mapping question IDs to user responses
 * @returns ScoringResult with totals, rankings, primary role, tie status, and narrative
 */
export function scoreResponses(responses: QuizResponses): ScoringResult {
  // Initialize role scores to zero
  const totals: RoleScores = {
    BE: 0,
    FE: 0,
    QA: 0,
    PM: 0,
  };

  // Track strong-signal counts per role (answers with +2 or +3 points)
  const strongSignalCounts: RoleScores = {
    BE: 0,
    FE: 0,
    QA: 0,
    PM: 0,
  };

  // Track question contributions for narrative generation
  // Maps question ID to the role that received the highest score from that question
  const questionContributions: Array<{
    questionId: number;
    roleId: RoleId;
    score: number;
    optionText: string;
  }> = [];

  // Accumulate skill tags from all selected options
  const skillTagFrequency: Record<string, number> = {};
  const allSkillTags = new Set<string>();

  // Track evidence highlights from strong-signal answers (+2 or +3)
  const evidenceHighlights: EvidenceHighlight[] = [];

  // Process core questions (IDs 1-10)
  for (const question of QUESTIONS) {
    const response = responses[question.id];

    // Skip if no response provided for this question
    if (response === undefined || response === null) {
      continue;
    }

    // Track the highest scoring role for this question
    let maxQuestionScore = -Infinity;
    let maxQuestionRole: RoleId | null = null;
    let selectedOptionText = "";

    // Handle different question types
    if (question.type === "forced_choice" || question.type === "likert") {
      // Single value response
      const optionIndex = response as number;
      if (
        optionIndex >= 0 &&
        optionIndex < question.scoring.length &&
        optionIndex < question.optionMetadata.length
      ) {
        const scoring = question.scoring[optionIndex];
        const metadata = question.optionMetadata[optionIndex];
        selectedOptionText = question.options[optionIndex];

        // Add scores to totals
        totals.BE += scoring.BE;
        totals.FE += scoring.FE;
        totals.QA += scoring.QA;
        totals.PM += scoring.PM;

        // Accumulate skill tags
        for (const signal of metadata.signals) {
          allSkillTags.add(signal);
          skillTagFrequency[signal] = (skillTagFrequency[signal] || 0) + 1;
        }

        // Track highest scoring role for this question
        const roleScores = [scoring.BE, scoring.FE, scoring.QA, scoring.PM];
        const maxScore = Math.max(...roleScores);
        if (maxScore > 0) {
          const roleIndex = roleScores.indexOf(maxScore);
          const roleIds: RoleId[] = ["BE", "FE", "QA", "PM"];
          maxQuestionRole = roleIds[roleIndex];
          maxQuestionScore = maxScore;
        }

        // Count strong signals: forced choice (always +2) or Likert extremes (+2)
        // For forced choice and likert, strong signal = score of 2
        const isStrongSignal = maxScore === 2;
        if (isStrongSignal) {
          if (scoring.BE === 2) strongSignalCounts.BE++;
          if (scoring.FE === 2) strongSignalCounts.FE++;
          if (scoring.QA === 2) strongSignalCounts.QA++;
          if (scoring.PM === 2) strongSignalCounts.PM++;

          // Add to evidence highlights
          evidenceHighlights.push({
            questionId: question.id,
            questionPrompt: question.prompt,
            optionText: selectedOptionText,
            evidence: metadata.evidence,
            signals: metadata.signals,
            score: maxScore,
          });
        }
      }
    } else if (question.type === "multiple_choice") {
      // Array of selected options
      const selectedIndices = response as number[];
      if (Array.isArray(selectedIndices)) {
        let questionMaxScore = -Infinity;
        let questionMaxRole: RoleId | null = null;
        const selectedOptions: string[] = [];

        for (const optionIndex of selectedIndices) {
          if (
            optionIndex >= 0 &&
            optionIndex < question.scoring.length &&
            optionIndex < question.optionMetadata.length
          ) {
            const scoring = question.scoring[optionIndex];
            const metadata = question.optionMetadata[optionIndex];
            selectedOptions.push(question.options[optionIndex]);

            // Add scores to totals
            totals.BE += scoring.BE;
            totals.FE += scoring.FE;
            totals.QA += scoring.QA;
            totals.PM += scoring.PM;

            // Accumulate skill tags
            for (const signal of metadata.signals) {
              allSkillTags.add(signal);
              skillTagFrequency[signal] = (skillTagFrequency[signal] || 0) + 1;
            }

            // Track highest scoring role for this option
            const roleScores = [scoring.BE, scoring.FE, scoring.QA, scoring.PM];
            const maxScore = Math.max(...roleScores);
            if (maxScore > questionMaxScore) {
              const roleIndex = roleScores.indexOf(maxScore);
              const roleIds: RoleId[] = ["BE", "FE", "QA", "PM"];
              questionMaxRole = roleIds[roleIndex];
              questionMaxScore = maxScore;
            }

            // Multi-select questions use +1 per selection, so they don't count as strong signals
            // Strong signals are only forced choice (+2) and Likert extremes (+2)
            // Multi-select selections are +1 each, so skip strong signal tracking
          }
        }

        if (questionMaxRole && questionMaxScore > 0) {
          maxQuestionRole = questionMaxRole;
          maxQuestionScore = questionMaxScore;
          selectedOptionText = selectedOptions.join(", ");
        }
      }
    }

    // Record question contribution for narrative
    if (maxQuestionRole && maxQuestionScore > 0) {
      questionContributions.push({
        questionId: question.id,
        roleId: maxQuestionRole,
        score: maxQuestionScore,
        optionText: selectedOptionText,
      });
    }
  }

  // Process bonus questions (IDs >= 100)
  // Bonus questions are included in responses if they were shown to the user
  // They contribute to scoring but don't affect the core question count
  for (const bonusQuestion of BONUS_QUESTIONS) {
    const response = responses[bonusQuestion.id];

    // Skip if no response provided for this bonus question
    if (response === undefined || response === null) {
      continue;
    }

    // Bonus questions are always Likert scale (single value response)
    if (bonusQuestion.type === "likert") {
      const optionIndex = response as number;
      if (
        optionIndex >= 0 &&
        optionIndex < bonusQuestion.scoring.length &&
        optionIndex < bonusQuestion.optionMetadata.length
      ) {
        const scoring = bonusQuestion.scoring[optionIndex];
        const metadata = bonusQuestion.optionMetadata[optionIndex];

        // Add scores to totals
        totals.BE += scoring.BE;
        totals.FE += scoring.FE;
        totals.QA += scoring.QA;
        totals.PM += scoring.PM;

        // Accumulate skill tags
        for (const signal of metadata.signals) {
          allSkillTags.add(signal);
          skillTagFrequency[signal] = (skillTagFrequency[signal] || 0) + 1;
        }

        // Track strong signals (+2) from bonus questions
        const roleScores = [scoring.BE, scoring.FE, scoring.QA, scoring.PM];
        const maxScore = Math.max(...roleScores);
        if (maxScore === 2) {
          if (scoring.BE === 2) strongSignalCounts.BE++;
          if (scoring.FE === 2) strongSignalCounts.FE++;
          if (scoring.QA === 2) strongSignalCounts.QA++;
          if (scoring.PM === 2) strongSignalCounts.PM++;
        }
      }
    }
  }

  // Create ranked roles array with tie-breaking
  const roleEntries: Array<[RoleId, number]> = Object.entries(totals) as Array<
    [RoleId, number]
  >;

  // Sort by score (descending), then by strong-signal count as first tie-breaker, then alphabetically
  roleEntries.sort((a, b) => {
    // First: by total score
    if (b[1] !== a[1]) {
      return b[1] - a[1]; // Higher score first
    }
    // Second: by strong-signal count (FIRST tie-breaker when scores are equal)
    const aStrongSignals = strongSignalCounts[a[0]];
    const bStrongSignals = strongSignalCounts[b[0]];
    if (bStrongSignals !== aStrongSignals) {
      return bStrongSignals - aStrongSignals; // More strong signals first
    }
    // Third: alphabetical for consistency
    return a[0].localeCompare(b[0]);
  });

  // Build ranked array with rank numbers
  const ranked: RankedRole[] = roleEntries.map(([roleId, score], index) => {
    // Determine rank (handle ties - same score = same rank)
    let rank = index + 1;
    if (index > 0) {
      const prevScore = roleEntries[index - 1][1];
      const prevStrongSignals = strongSignalCounts[roleEntries[index - 1][0]];
      const currStrongSignals = strongSignalCounts[roleId];

      // Same rank if score AND strong-signal count are equal
      if (prevScore === score && prevStrongSignals === currStrongSignals) {
        rank = ranked[index - 1].rank;
      }
    }

    return {
      roleId,
      score,
      rank,
    };
  });

  // Determine primary role and handle ties
  const highestScore = ranked[0].score;
  const highestStrongSignals = strongSignalCounts[ranked[0].roleId];

  // Find all roles tied for first place (same score AND same strong-signal count)
  const tiedRoles = ranked.filter(
    (r) =>
      r.score === highestScore &&
      r.rank === 1 &&
      strongSignalCounts[r.roleId] === highestStrongSignals,
  );

  const tieDetected = tiedRoles.length > 1;
  let primaryRole: RoleId | string;
  let secondaryRole: RoleId | undefined;

  if (tieDetected && tiedRoles.length === 2) {
    // Two-way tie: return "Primary + Secondary" format
    primaryRole = `${tiedRoles[0].roleId} + ${tiedRoles[1].roleId}`;
    secondaryRole = tiedRoles[1].roleId;
  } else if (tieDetected) {
    // Multiple ties: use first two alphabetically
    const sortedTied = [...tiedRoles].sort((a, b) =>
      a.roleId.localeCompare(b.roleId),
    );
    primaryRole = `${sortedTied[0].roleId} + ${sortedTied[1].roleId}`;
    secondaryRole = sortedTied[1].roleId;
  } else {
    // No tie: single primary role
    primaryRole = ranked[0].roleId;
    secondaryRole = ranked[1]?.roleId;
  }

  // Generate narrative summary
  const narrative = generateNarrative(
    totals,
    ranked,
    primaryRole,
    secondaryRole,
    tieDetected,
    questionContributions,
    responses,
  );

  // Sort evidence highlights by score (descending) and take top 3-5
  const sortedEvidence = evidenceHighlights
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Build skill profile
  const skillProfile: SkillProfile = {
    tags: Array.from(allSkillTags).sort(),
    tagFrequency: skillTagFrequency,
  };

  // Calculate dominance score (difference between top and second place)
  // This indicates how clear the primary role assignment is
  const dominanceScore =
    ranked.length >= 2 ? ranked[0].score - ranked[1].score : ranked[0].score;

  // Calculate confidence band based on dominance score and tie status
  // Scoring rationale:
  // - Strong: Clear winner with high dominance (≥6 points) - very confident assignment
  // - Clear: Clear winner with moderate dominance (3-5 points) - confident assignment
  // - Split: Close scores (≤2 points) - indicates hybrid strengths or unclear preference
  // - Hybrid: Tied roles - balanced profile across multiple roles
  let confidenceBand: ConfidenceBand;
  if (tieDetected) {
    confidenceBand = "Hybrid";
  } else if (dominanceScore >= 6) {
    confidenceBand = "Strong";
  } else if (dominanceScore >= 3) {
    confidenceBand = "Clear";
  } else {
    confidenceBand = "Split";
  }

  return {
    totals,
    ranked,
    primaryRole,
    secondaryRole,
    tieDetected,
    narrative,
    skillProfile,
    evidenceHighlights: sortedEvidence,
    dominanceScore,
    confidenceBand,
  };
}

/**
 * Helper function to generate a narrative summary of the scoring results
 *
 * @param totals - Role score totals
 * @param ranked - Ranked roles array
 * @param primaryRole - The primary role (can be single role or "Role1 + Role2" format)
 * @param secondaryRole - The secondary role (if applicable)
 * @param tieDetected - Whether there's a tie for first place
 * @param questionContributions - Array of question contributions for narrative bullets
 * @param responses - Original user responses for context
 * @returns Narrative string describing the results
 */
function generateNarrative(
  totals: RoleScores,
  ranked: RankedRole[],
  primaryRole: RoleId | string,
  secondaryRole: RoleId | undefined,
  tieDetected: boolean,
  questionContributions: Array<{
    questionId: number;
    roleId: RoleId;
    score: number;
    optionText: string;
  }>,
  responses: QuizResponses,
): string {
  // Determine primary and secondary role info
  let primaryRoleInfo: Role;
  let secondaryRoleInfo: Role | null = null;

  if (typeof primaryRole === "string" && primaryRole.includes(" + ")) {
    // Handle "Role1 + Role2" format
    const [role1, role2] = primaryRole.split(" + ") as [RoleId, RoleId];
    primaryRoleInfo = ROLES[role1];
    secondaryRoleInfo = ROLES[role2];
  } else {
    // Single primary role
    primaryRoleInfo = ROLES[primaryRole as RoleId];
    if (secondaryRole) {
      secondaryRoleInfo = ROLES[secondaryRole];
    }
  }

  // Start narrative with primary role
  let narrative = `Based on your responses, your strongest alignment is with the ${primaryRoleInfo.label} role. `;
  narrative += `${primaryRoleInfo.explanation} `;

  // Add secondary role explanation if applicable
  if (tieDetected && secondaryRoleInfo) {
    narrative += `\n\nYou also show strong alignment with the ${secondaryRoleInfo.label} role. `;
    narrative += `${secondaryRoleInfo.explanation} `;
  } else if (secondaryRoleInfo && secondaryRole && !tieDetected) {
    const primaryScore = totals[primaryRole as RoleId];
    const secondaryScore = totals[secondaryRole];
    const scoreDifference = primaryScore - secondaryScore;
    const scores = Object.values(totals);
    const scoreRange = Math.max(...scores) - Math.min(...scores);

    if (scoreDifference <= scoreRange * 0.2) {
      // Close scores - mention secondary role
      narrative += `\n\nYou also show strong alignment with the ${secondaryRoleInfo.label} role, `;
      narrative += `with your scores being relatively balanced between these two areas. `;
      narrative += `${secondaryRoleInfo.explanation} `;
    }
  }

  // Find top 2 highest-scoring questions for the primary role(s)
  const primaryRoleIds: RoleId[] =
    typeof primaryRole === "string" && primaryRole.includes(" + ")
      ? (primaryRole.split(" + ") as RoleId[])
      : [primaryRole as RoleId];

  // Filter contributions for primary role(s) and sort by score
  const relevantContributions = questionContributions
    .filter((contrib) => primaryRoleIds.includes(contrib.roleId))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // Get question prompts for the top contributions
  const topReasons: string[] = [];
  for (const contrib of relevantContributions) {
    const question = QUESTIONS.find((q) => q.id === contrib.questionId);
    if (question) {
      // Create a bullet point explaining why this question indicates the role
      const reason = `Your response "${contrib.optionText}" to "${question.prompt}" `;
      topReasons.push(reason);
    }
  }

  // Add "why" reasons as bullet points
  if (topReasons.length > 0) {
    narrative += `\n\nHere's why this role fits you:\n`;
    topReasons.forEach((reason) => {
      narrative += `• ${reason}\n`;
    });
  }

  return narrative.trim();
}
