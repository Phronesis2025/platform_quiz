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
 * Array of 10 quiz questions designed to identify role fit
 * Questions use data-analyst-friendly wording and structured scoring
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    type: "forced_choice",
    prompt:
      "When starting a project with unclear requirements and a tight timeline, what concerns you most?",
    options: [
      "Ensuring the underlying logic and data flow are correct",
      "Making sure priorities, scope, and expectations are clear",
      "Preventing errors or regressions later",
      "Making sure the end result is intuitive and usable",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // B → PM
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // D → FE
    ],
    optionMetadata: [
      {
        signals: ["Root-cause thinking", "System architecture", "Data integrity"],
        evidence: "You prioritize getting the foundational logic right, even when requirements are unclear.",
      },
      {
        signals: ["Prioritization under pressure", "Scope management", "Stakeholder communication"],
        evidence: "You focus on clarifying what matters most and setting clear expectations before diving in.",
      },
      {
        signals: ["Risk spotting", "Preventive thinking", "Quality mindset"],
        evidence: "You're concerned about preventing problems that could cause issues down the line.",
      },
      {
        signals: ["User empathy", "Usability focus", "User experience"],
        evidence: "You want to ensure the end result makes sense to users and is easy to use.",
      },
    ],
  },
  {
    id: 2,
    type: "multiple_choice",
    prompt:
      "Which tasks do you find most engaging? (Select up to 2)",
    options: [
      "Tracing issues back to their root cause",
      "Improving how information is presented to users",
      "Verifying accuracy and catching edge cases",
      "Coordinating work, priorities, and timelines",
    ],
    scoring: [
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // Tracing issues → BE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // Improving presentation → FE
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // Verifying accuracy → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // Coordinating work → PM
    ],
    optionMetadata: [
      {
        signals: ["Root-cause thinking", "Systematic investigation", "Problem-solving"],
        evidence: "You enjoy digging deep to understand why something isn't working as expected.",
      },
      {
        signals: ["User empathy", "Presentation clarity", "Usability focus"],
        evidence: "You find satisfaction in making information clearer and more accessible to users.",
      },
      {
        signals: ["Quality assurance", "Attention to detail", "Risk mitigation"],
        evidence: "You take pride in catching errors and edge cases that others might miss.",
      },
      {
        signals: ["Coordination", "Prioritization", "Stakeholder management"],
        evidence: "You enjoy bringing people together and ensuring work flows smoothly.",
      },
    ],
  },
  {
    id: 3,
    type: "likert",
    prompt:
      "When a deadline is tight, I prefer to slow down briefly to reduce future rework.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // SD → FE
      { BE: 0, FE: 1, QA: 0, PM: 1 }, // D → FE / PM
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // N → BE
      { BE: 0, FE: 0, QA: 1, PM: 1 }, // A → QA / PM
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // SA → QA
    ],
    optionMetadata: [
      {
        signals: ["Speed preference", "Action-oriented", "Rapid iteration"],
        evidence: "You prefer to move quickly and iterate rather than slowing down for planning.",
      },
      {
        signals: ["Pragmatic balance", "Flexible approach"],
        evidence: "You balance speed with some consideration for future impact.",
      },
      {
        signals: ["Balanced perspective", "Context-dependent"],
        evidence: "You adapt your approach based on the specific situation and context.",
      },
      {
        signals: ["Preventive thinking", "Quality focus", "Long-term view"],
        evidence: "You believe taking time upfront prevents problems and saves time later.",
      },
      {
        signals: ["Quality-first mindset", "Risk mitigation", "Systematic approach"],
        evidence: "You strongly believe that investing time in quality upfront prevents costly rework.",
      },
    ],
  },
  {
    id: 4,
    type: "forced_choice",
    prompt:
      "If you could master one capability, which would it be?",
    options: [
      "Diagnosing complex logic or data issues",
      "Translating complex work into clear, usable outputs",
      "Designing checks that prevent errors before release",
      "Managing priorities, risks, and communication",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // B → FE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // D → PM
    ],
    optionMetadata: [
      {
        signals: ["Technical depth", "Root-cause thinking", "Systematic analysis"],
        evidence: "You want to excel at understanding and fixing complex technical problems.",
      },
      {
        signals: ["Communication", "User empathy", "Clarity"],
        evidence: "You value the ability to make complex information accessible and understandable.",
      },
      {
        signals: ["Quality assurance", "Preventive thinking", "Risk mitigation"],
        evidence: "You want to master building systems that catch problems before they reach users.",
      },
      {
        signals: ["Stakeholder management", "Prioritization", "Coordination"],
        evidence: "You believe success comes from effectively managing people, priorities, and risks.",
      },
    ],
  },
  {
    id: 5,
    type: "likert",
    prompt:
      "I enjoy working directly with users or stakeholders to understand how outputs are used.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 2, PM: 0 }, // SD → BE / QA
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // D → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // N → PM
      { BE: 0, FE: 1, QA: 0, PM: 1 }, // A → FE / PM
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // SA → FE
    ],
    optionMetadata: [
      {
        signals: ["Technical focus", "System-oriented", "Preference for technical work"],
        evidence: "You prefer working with systems and data rather than direct user interaction.",
      },
      {
        signals: ["Moderate user awareness", "Technical preference"],
        evidence: "You understand users matter but prefer focusing on technical implementation.",
      },
      {
        signals: ["Balanced perspective", "Flexible approach"],
        evidence: "You're open to user interaction when needed but don't actively seek it out.",
      },
      {
        signals: ["User empathy", "Stakeholder engagement", "User-centered thinking"],
        evidence: "You value understanding user needs directly and find it improves your work.",
      },
      {
        signals: ["Strong user empathy", "User advocacy", "Customer focus"],
        evidence: "You believe the best outputs come from deep understanding of how users actually use them.",
      },
    ],
  },
  {
    id: 6,
    type: "forced_choice",
    prompt:
      "You encounter a problem you don't fully understand. What's your first move?",
    options: [
      "Map the system or logic end-to-end",
      "Try small changes to see what improves",
      "Reproduce and document the issue precisely",
      "Clarify impact, urgency, and ownership",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // B → FE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // D → PM
    ],
    optionMetadata: [
      {
        signals: ["System thinking", "Root-cause analysis", "Comprehensive understanding"],
        evidence: "You start by understanding the full picture before making changes.",
      },
      {
        signals: ["Rapid iteration", "Experimental approach", "User feedback"],
        evidence: "You prefer to try things and see what works, learning through experimentation.",
      },
      {
        signals: ["Systematic documentation", "Precision", "Quality mindset"],
        evidence: "You want to understand the problem exactly as it is before attempting a solution.",
      },
      {
        signals: ["Stakeholder management", "Prioritization", "Context gathering"],
        evidence: "You first understand who's affected, how urgent it is, and who should handle it.",
      },
    ],
  },
  {
    id: 7,
    type: "multiple_choice",
    prompt:
      "Which types of tools are you most comfortable working with? (Select up to 2)",
    options: [
      "Data models, queries, calculations, or transformations",
      "Dashboards, reports, UI configuration",
      "Validation rules, testing tools, quality checks",
      "Workflow tools, deployment processes, access/security",
    ],
    scoring: [
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // Data models → BE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // Dashboards → FE
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // Validation rules → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // Workflow tools → PM
    ],
    optionMetadata: [
      {
        signals: ["Data modeling", "Technical depth", "System architecture"],
        evidence: "You're comfortable working with data structures, queries, and transformations.",
      },
      {
        signals: ["User interface", "Presentation", "Usability"],
        evidence: "You enjoy working with tools that help users see and interact with information.",
      },
      {
        signals: ["Quality assurance", "Validation", "Systematic checking"],
        evidence: "You value tools that help ensure accuracy and catch problems.",
      },
      {
        signals: ["Process management", "Coordination", "Operational tools"],
        evidence: "You're comfortable with tools that help manage workflows and access.",
      },
    ],
  },
  {
    id: 8,
    type: "likert",
    prompt:
      "I'm comfortable investigating issues in live systems under time pressure.",
    options: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    scoring: [
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // SD → QA
      { BE: 0, FE: 1, QA: 1, PM: 0 }, // D → QA / FE
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // N → PM
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // SA → BE
    ],
    optionMetadata: [
      {
        signals: ["Preference for stability", "Planned work", "Controlled environments"],
        evidence: "You prefer working in controlled environments where issues can be addressed methodically.",
      },
      {
        signals: ["Moderate pressure tolerance", "Preference for planning"],
        evidence: "You can handle some pressure but prefer having time to think through problems carefully.",
      },
      {
        signals: ["Adaptable", "Balanced approach"],
        evidence: "You can work under pressure when needed but don't actively seek high-stress situations.",
      },
      {
        signals: ["Problem-solving under pressure", "Technical troubleshooting", "Crisis management"],
        evidence: "You stay calm and focused when production issues arise, using systematic debugging approaches.",
      },
      {
        signals: ["Thrives under pressure", "Rapid problem-solving", "Production expertise"],
        evidence: "You excel at diagnosing and fixing issues quickly, even when the stakes are high and time is limited.",
      },
    ],
  },
  {
    id: 9,
    type: "forced_choice",
    prompt:
      "What gives you the most satisfaction at work?",
    options: [
      "Solving a hard problem others couldn't",
      "Seeing users quickly understand and adopt something",
      "Knowing errors were prevented before they caused issues",
      "Seeing a complex effort run smoothly end-to-end",
    ],
    scoring: [
      { BE: 2, FE: 0, QA: 0, PM: 0 }, // A → BE
      { BE: 0, FE: 2, QA: 0, PM: 0 }, // B → FE
      { BE: 0, FE: 0, QA: 2, PM: 0 }, // C → QA
      { BE: 0, FE: 0, QA: 0, PM: 2 }, // D → PM
    ],
    optionMetadata: [
      {
        signals: ["Technical excellence", "Problem-solving", "Intellectual challenge"],
        evidence: "You find deep satisfaction in tackling difficult technical problems and finding solutions.",
      },
      {
        signals: ["User adoption", "Usability", "User empathy"],
        evidence: "You're motivated by seeing users quickly understand and benefit from your work.",
      },
      {
        signals: ["Quality assurance", "Risk prevention", "Preventive thinking"],
        evidence: "You take satisfaction in knowing you prevented problems before they could cause issues.",
      },
      {
        signals: ["Coordination", "Process excellence", "End-to-end success"],
        evidence: "You find satisfaction in seeing complex projects come together smoothly and successfully.",
      },
    ],
  },
  {
    id: 10,
    type: "multiple_choice",
    prompt:
      "What activities do you most enjoy day-to-day? (Select up to 2)",
    options: [
      "Deep investigation and analysis",
      "Refining layout, wording, or usability",
      "Reviewing work for accuracy and consistency",
      "Planning, coordinating, and communicating",
    ],
    scoring: [
      { BE: 1, FE: 0, QA: 0, PM: 0 }, // Deep investigation → BE
      { BE: 0, FE: 1, QA: 0, PM: 0 }, // Refining layout → FE
      { BE: 0, FE: 0, QA: 1, PM: 0 }, // Reviewing work → QA
      { BE: 0, FE: 0, QA: 0, PM: 1 }, // Planning/coordinating → PM
    ],
    optionMetadata: [
      {
        signals: ["Analytical thinking", "Deep dive", "Problem-solving"],
        evidence: "You enjoy digging deep into problems and understanding them thoroughly.",
      },
      {
        signals: ["User experience", "Attention to detail", "Iterative improvement"],
        evidence: "You find satisfaction in making outputs clearer, more usable, and better presented.",
      },
      {
        signals: ["Quality assurance", "Attention to detail", "Systematic review"],
        evidence: "You take pride in ensuring work is accurate and consistent.",
      },
      {
        signals: ["Coordination", "Communication", "Strategic planning"],
        evidence: "You enjoy bringing people together and ensuring work flows smoothly.",
      },
    ],
  },
];

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

  // Process each question response
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
      strongSignalCounts[r.roleId] === highestStrongSignals
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
      a.roleId.localeCompare(b.roleId)
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
    responses
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

  return {
    totals,
    ranked,
    primaryRole,
    secondaryRole,
    tieDetected,
    narrative,
    skillProfile,
    evidenceHighlights: sortedEvidence,
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
  responses: QuizResponses
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
  const primaryRoleIds: RoleId[] = typeof primaryRole === "string" && primaryRole.includes(" + ")
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
