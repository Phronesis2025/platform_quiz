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
      "When starting a new project, what is your primary concern?",
    options: [
      "User experience and visual design",
      "Data structure and system architecture",
      "Testing strategy and quality assurance",
      "Feature requirements and business value",
    ],
    scoring: [
      { BE: 0, FE: 5, QA: 1, PM: 2 }, // User experience
      { BE: 5, FE: 1, QA: 2, PM: 1 }, // Data structure
      { BE: 1, FE: 1, QA: 5, PM: 2 }, // Testing strategy
      { BE: 1, FE: 2, QA: 1, PM: 5 }, // Feature requirements
    ],
    optionMetadata: [
      {
        signals: ["User empathy", "Visual thinking", "Design sensibility"],
        evidence: "You prioritize how users will experience and interact with the product, focusing on intuitive design and visual appeal.",
      },
      {
        signals: ["System architecture", "Root-cause thinking", "Scalability planning"],
        evidence: "You think first about how data flows and systems connect, ensuring the foundation can support growth and complexity.",
      },
      {
        signals: ["Risk spotting", "Quality mindset", "Preventive thinking"],
        evidence: "You want to catch issues early by planning comprehensive testing, showing a proactive approach to quality.",
      },
      {
        signals: ["Prioritization under pressure", "Business alignment", "Stakeholder awareness"],
        evidence: "You focus on what delivers value to users and the business, balancing needs and constraints effectively.",
      },
    ],
  },
  {
    id: 2,
    type: "multiple_choice",
    prompt:
      "Which of the following tasks do you find most engaging? (Select all that apply)",
    options: [
      "Designing database schemas and optimizing queries",
      "Creating responsive layouts and animations",
      "Writing comprehensive test suites",
      "Gathering user feedback and defining roadmaps",
      "Building RESTful APIs and microservices",
      "Implementing accessibility features",
    ],
    scoring: [
      { BE: 4, FE: 0, QA: 1, PM: 1 }, // Database schemas
      { BE: 0, FE: 4, QA: 0, PM: 1 }, // Responsive layouts
      { BE: 1, FE: 1, QA: 4, PM: 1 }, // Test suites
      { BE: 1, FE: 1, QA: 1, PM: 4 }, // User feedback
      { BE: 4, FE: 1, QA: 1, PM: 1 }, // RESTful APIs
      { BE: 0, FE: 4, QA: 2, PM: 1 }, // Accessibility
    ],
    optionMetadata: [
      {
        signals: ["Data modeling", "Performance optimization", "System architecture"],
        evidence: "You enjoy structuring information efficiently and making systems perform at scale.",
      },
      {
        signals: ["Visual design", "User experience", "Creative problem-solving"],
        evidence: "You find satisfaction in creating interfaces that are both beautiful and functional across devices.",
      },
      {
        signals: ["Quality assurance", "Systematic thinking", "Risk mitigation"],
        evidence: "You take satisfaction in building comprehensive safety nets that prevent problems before they occur.",
      },
      {
        signals: ["User empathy", "Strategic planning", "Stakeholder communication"],
        evidence: "You value understanding user needs and translating them into actionable product plans.",
      },
      {
        signals: ["API design", "System integration", "Technical architecture"],
        evidence: "You enjoy building the connective tissue that allows different systems to communicate effectively.",
      },
      {
        signals: ["Inclusive design", "User empathy", "Attention to detail"],
        evidence: "You care deeply about ensuring products work for everyone, regardless of ability or device.",
      },
    ],
  },
  {
    id: 3,
    type: "likert",
    prompt:
      "How important is it to you that code is thoroughly tested before deployment?",
    options: [
      "Not important",
      "Somewhat important",
      "Moderately important",
      "Very important",
      "Extremely important",
    ],
    scoring: [
      { BE: 2, FE: 2, QA: -2, PM: 1 }, // Not important
      { BE: 1, FE: 1, QA: -1, PM: 0 }, // Somewhat important
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // Moderately important
      { BE: 1, FE: 1, QA: 2, PM: 1 }, // Very important
      { BE: 2, FE: 2, QA: 4, PM: 2 }, // Extremely important
    ],
    optionMetadata: [
      {
        signals: ["Speed over process", "Risk tolerance"],
        evidence: "You prioritize moving fast and are comfortable with less formal testing processes.",
      },
      {
        signals: ["Balanced approach", "Pragmatic thinking"],
        evidence: "You see value in testing but balance it against other priorities and constraints.",
      },
      {
        signals: ["Moderate risk awareness", "Balanced quality focus"],
        evidence: "You recognize testing as important but don't let it dominate your workflow.",
      },
      {
        signals: ["Quality mindset", "Risk awareness", "Preventive thinking"],
        evidence: "You believe thorough testing prevents problems and builds confidence in deployments.",
      },
      {
        signals: ["Quality-first mindset", "Risk mitigation", "Systematic validation"],
        evidence: "You see comprehensive testing as essential to building reliable, trustworthy systems.",
      },
    ],
  },
  {
    id: 4,
    type: "forced_choice",
    prompt:
      "If you had to choose one skill to master, which would it be?",
    options: [
      "System design and scalability",
      "CSS animations and responsive design",
      "Test automation and bug tracking",
      "Stakeholder communication and prioritization",
    ],
    scoring: [
      { BE: 5, FE: 1, QA: 2, PM: 2 }, // System design
      { BE: 0, FE: 5, QA: 1, PM: 1 }, // CSS animations
      { BE: 1, FE: 1, QA: 5, PM: 1 }, // Test automation
      { BE: 1, FE: 1, QA: 1, PM: 5 }, // Stakeholder communication
    ],
    optionMetadata: [
      {
        signals: ["System architecture", "Scalability thinking", "Technical depth"],
        evidence: "You want to master how complex systems work together and handle growth at scale.",
      },
      {
        signals: ["Visual design", "User experience", "Creative expression"],
        evidence: "You're drawn to the craft of creating engaging, responsive interfaces that delight users.",
      },
      {
        signals: ["Quality assurance", "Automation mindset", "Systematic problem-solving"],
        evidence: "You see value in building robust testing systems that catch issues automatically.",
      },
      {
        signals: ["Stakeholder management", "Prioritization", "Business alignment"],
        evidence: "You believe the key to success is understanding needs and aligning teams toward common goals.",
      },
    ],
  },
  {
    id: 5,
    type: "likert",
    prompt:
      "Rate your interest in working directly with end users to understand their needs.",
    options: [
      "Very low interest",
      "Low interest",
      "Neutral",
      "High interest",
      "Very high interest",
    ],
    scoring: [
      { BE: 2, FE: 1, QA: 1, PM: -2 }, // Very low
      { BE: 1, FE: 0, QA: 0, PM: -1 }, // Low
      { BE: 0, FE: 0, QA: 0, PM: 0 }, // Neutral
      { BE: -1, FE: 1, QA: 1, PM: 2 }, // High
      { BE: -2, FE: 2, QA: 2, PM: 4 }, // Very high
    ],
    optionMetadata: [
      {
        signals: ["Technical focus", "System-oriented thinking"],
        evidence: "You prefer working with systems and code rather than direct user interaction.",
      },
      {
        signals: ["Moderate user awareness", "Technical preference"],
        evidence: "You understand users matter but prefer to focus on technical implementation.",
      },
      {
        signals: ["Balanced perspective", "Flexible approach"],
        evidence: "You're open to user interaction when needed but don't seek it out actively.",
      },
      {
        signals: ["User empathy", "User-centered thinking"],
        evidence: "You value understanding user needs directly and find it informs better solutions.",
      },
      {
        signals: ["Strong user empathy", "User advocacy", "Customer focus"],
        evidence: "You believe the best products come from deep understanding of user needs and experiences.",
      },
    ],
  },
  {
    id: 6,
    type: "forced_choice",
    prompt:
      "What type of problem-solving approach do you prefer?",
    options: [
      "Breaking down complex systems into smaller components",
      "Creating intuitive and visually appealing solutions",
      "Systematically identifying and preventing issues",
      "Balancing multiple constraints and requirements",
    ],
    scoring: [
      { BE: 4, FE: 2, QA: 2, PM: 3 }, // Breaking down systems
      { BE: 1, FE: 4, QA: 1, PM: 2 }, // Visual solutions
      { BE: 2, FE: 1, QA: 4, PM: 2 }, // Preventing issues
      { BE: 2, FE: 2, QA: 2, PM: 4 }, // Balancing constraints
    ],
    optionMetadata: [
      {
        signals: ["Decomposition", "System thinking", "Analytical approach"],
        evidence: "You tackle complexity by breaking it into manageable pieces and understanding how they connect.",
      },
      {
        signals: ["Visual thinking", "User experience", "Creative problem-solving"],
        evidence: "You solve problems by making them visible, intuitive, and appealing to users.",
      },
      {
        signals: ["Risk spotting", "Preventive thinking", "Systematic analysis"],
        evidence: "You approach problems by identifying potential issues before they become real problems.",
      },
      {
        signals: ["Prioritization", "Stakeholder management", "Balanced decision-making"],
        evidence: "You excel at weighing competing needs and finding solutions that satisfy multiple constraints.",
      },
    ],
  },
  {
    id: 7,
    type: "multiple_choice",
    prompt:
      "Which tools or technologies interest you most? (Select all that apply)",
    options: [
      "Docker, Kubernetes, cloud infrastructure",
      "React, Vue, or other frontend frameworks",
      "Selenium, Jest, Cypress testing tools",
      "Jira, Confluence, product analytics",
      "PostgreSQL, Redis, message queues",
      "Figma, design systems, UI libraries",
    ],
    scoring: [
      { BE: 4, FE: 1, QA: 2, PM: 1 }, // Docker/Kubernetes
      { BE: 1, FE: 4, QA: 1, PM: 1 }, // Frontend frameworks
      { BE: 1, FE: 1, QA: 4, PM: 1 }, // Testing tools
      { BE: 1, FE: 1, QA: 2, PM: 4 }, // Jira/Confluence
      { BE: 4, FE: 0, QA: 1, PM: 1 }, // Databases/queues
      { BE: 0, FE: 4, QA: 1, PM: 2 }, // Figma/design
    ],
    optionMetadata: [
      {
        signals: ["Infrastructure", "DevOps", "System scalability"],
        evidence: "You're interested in how applications run at scale and how infrastructure supports them.",
      },
      {
        signals: ["Frontend development", "User interface", "Modern web technologies"],
        evidence: "You enjoy building interactive user interfaces with modern frameworks and tools.",
      },
      {
        signals: ["Test automation", "Quality assurance", "Systematic validation"],
        evidence: "You value tools that help ensure software quality through automated testing.",
      },
      {
        signals: ["Product management", "Collaboration", "Data-driven decisions"],
        evidence: "You're drawn to tools that help teams collaborate and make decisions based on data.",
      },
      {
        signals: ["Data persistence", "System architecture", "Performance optimization"],
        evidence: "You're interested in how data is stored, retrieved, and processed efficiently.",
      },
      {
        signals: ["Design systems", "Visual design", "UI consistency"],
        evidence: "You care about creating cohesive, reusable design patterns that improve user experience.",
      },
    ],
  },
  {
    id: 8,
    type: "likert",
    prompt:
      "How comfortable are you with debugging production issues under time pressure?",
    options: [
      "Very uncomfortable",
      "Somewhat uncomfortable",
      "Neutral",
      "Comfortable",
      "Very comfortable",
    ],
    scoring: [
      { BE: -1, FE: -1, QA: 0, PM: -2 }, // Very uncomfortable
      { BE: 0, FE: 0, QA: 1, PM: -1 }, // Somewhat uncomfortable
      { BE: 1, FE: 1, QA: 1, PM: 0 }, // Neutral
      { BE: 3, FE: 2, QA: 2, PM: 1 }, // Comfortable
      { BE: 4, FE: 3, QA: 3, PM: 1 }, // Very comfortable
    ],
    optionMetadata: [
      {
        signals: ["Preference for stability", "Planned work"],
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
        signals: ["Problem-solving under pressure", "Crisis management", "Technical troubleshooting"],
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
      "What motivates you most in your work?",
    options: [
      "Building robust and scalable systems",
      "Creating beautiful and functional user interfaces",
      "Ensuring quality and preventing bugs",
      "Delivering value and meeting business goals",
    ],
    scoring: [
      { BE: 5, FE: 1, QA: 2, PM: 2 }, // Robust systems
      { BE: 0, FE: 5, QA: 1, PM: 2 }, // Beautiful interfaces
      { BE: 1, FE: 1, QA: 5, PM: 1 }, // Quality assurance
      { BE: 1, FE: 2, QA: 1, PM: 5 }, // Business value
    ],
    optionMetadata: [
      {
        signals: ["System architecture", "Scalability", "Technical excellence"],
        evidence: "You're driven by creating systems that are reliable, performant, and can grow with demand.",
      },
      {
        signals: ["Visual design", "User experience", "Creative expression"],
        evidence: "You find motivation in crafting interfaces that are both aesthetically pleasing and highly functional.",
      },
      {
        signals: ["Quality mindset", "Risk prevention", "Attention to detail"],
        evidence: "You're motivated by ensuring products work correctly and preventing problems before they impact users.",
      },
      {
        signals: ["Business impact", "Value delivery", "Stakeholder success"],
        evidence: "You're driven by seeing your work make a real difference to users and the business.",
      },
    ],
  },
  {
    id: 10,
    type: "multiple_choice",
    prompt:
      "What activities do you enjoy in your daily work? (Select all that apply)",
    options: [
      "Optimizing database queries and API performance",
      "Prototyping new UI components and interactions",
      "Writing test cases and regression testing",
      "Conducting user interviews and analyzing metrics",
      "Designing API contracts and data models",
      "Ensuring cross-browser compatibility",
    ],
    scoring: [
      { BE: 4, FE: 1, QA: 1, PM: 1 }, // Optimizing queries
      { BE: 0, FE: 4, QA: 0, PM: 1 }, // Prototyping UI
      { BE: 1, FE: 1, QA: 4, PM: 1 }, // Test cases
      { BE: 0, FE: 1, QA: 1, PM: 4 }, // User interviews
      { BE: 4, FE: 1, QA: 1, PM: 2 }, // API contracts
      { BE: 0, FE: 4, QA: 2, PM: 1 }, // Cross-browser
    ],
    optionMetadata: [
      {
        signals: ["Performance optimization", "Root-cause thinking", "Technical depth"],
        evidence: "You enjoy the challenge of making systems faster and more efficient through careful analysis and optimization.",
      },
      {
        signals: ["Rapid prototyping", "Creative exploration", "User experience"],
        evidence: "You love experimenting with new interface ideas and seeing how users interact with them.",
      },
      {
        signals: ["Systematic testing", "Quality assurance", "Preventive thinking"],
        evidence: "You find satisfaction in building comprehensive test coverage that catches edge cases and regressions.",
      },
      {
        signals: ["User research", "Data analysis", "User empathy"],
        evidence: "You enjoy learning directly from users and using data to inform product decisions.",
      },
      {
        signals: ["API design", "System architecture", "Technical planning"],
        evidence: "You enjoy designing clean interfaces between systems that are maintainable and extensible.",
      },
      {
        signals: ["Attention to detail", "Cross-platform thinking", "User experience"],
        evidence: "You take pride in ensuring products work consistently across different browsers and devices.",
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

        // Count strong signals (+2 or +3) and collect evidence
        const isStrongSignal = maxScore >= 2;
        if (isStrongSignal) {
          if (scoring.BE >= 2) strongSignalCounts.BE++;
          if (scoring.FE >= 2) strongSignalCounts.FE++;
          if (scoring.QA >= 2) strongSignalCounts.QA++;
          if (scoring.PM >= 2) strongSignalCounts.PM++;

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

            // Count strong signals (+2 or +3) and collect evidence
            const isStrongSignal = maxScore >= 2;
            if (isStrongSignal) {
              if (scoring.BE >= 2) strongSignalCounts.BE++;
              if (scoring.FE >= 2) strongSignalCounts.FE++;
              if (scoring.QA >= 2) strongSignalCounts.QA++;
              if (scoring.PM >= 2) strongSignalCounts.PM++;

              // Add to evidence highlights
              evidenceHighlights.push({
                questionId: question.id,
                questionPrompt: question.prompt,
                optionText: question.options[optionIndex],
                evidence: metadata.evidence,
                signals: metadata.signals,
                score: maxScore,
              });
            }
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

  // Sort by score (descending), then by strong-signal count, then alphabetically
  roleEntries.sort((a, b) => {
    // First: by total score
    if (b[1] !== a[1]) {
      return b[1] - a[1]; // Higher score first
    }
    // Second: by strong-signal count (tie-breaker)
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
