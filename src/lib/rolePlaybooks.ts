/**
 * Role Playbooks
 * 
 * Practical, actionable content for each role to help teams understand
 * strengths, best use cases, common pitfalls, and how to support each role.
 * 
 * Written in plain language for analysts and team members.
 */

import type { RoleId } from "./quiz";

/**
 * Playbook content for a role
 */
export interface RolePlaybook {
  roleLabel: string;
  strengths: string[];
  bestUsedFor: string[];
  watchOutFor: string[];
  howToSupportYou: string[];
  howToContributeIfNotPrimary: string[];
}

/**
 * Role playbooks mapped by role ID
 */
export const ROLE_PLAYBOOKS: Record<RoleId, RolePlaybook> = {
  BE: {
    roleLabel: "Backend-Focused Analyst",
    strengths: [
      "Spots root causes in messy logic/data chains",
      "Handles ambiguity without panicking",
      "Builds durable fixes instead of band-aids",
      "Thinks in systems and dependencies",
      "Optimizes processes once understood",
    ],
    bestUsedFor: [
      "Tracing metric discrepancies to the source definition/logic",
      "Fixing broken transformations, joins, mappings, refresh issues",
      "Designing robust calculations/semantic rules",
      "Debugging complex pipelines where multiple steps interact",
      "Hardening logic so it doesn't break next month",
    ],
    watchOutFor: [
      "Over-investigating when urgency demands a temporary containment plan",
      "Communicating in overly technical detail",
      "Underestimating the \"human usability\" of outputs",
    ],
    howToSupportYou: [
      "Give clear definition of \"done\" and impact scope",
      "Protect focus time during investigations",
      "Pair with PM/QA for rollout + validation",
    ],
    howToContributeIfNotPrimary: [
      "Ask clarifying questions about definitions and logic—fresh eyes catch assumptions",
      "Help document findings and create user-friendly summaries",
      "Support validation and testing of fixes before rollout",
      "Contribute domain knowledge about how the data is actually used",
      "Assist with stakeholder communication and change management",
    ],
  },
  FE: {
    roleLabel: "Frontend-Focused Analyst",
    strengths: [
      "Makes outputs intuitive and easy to consume",
      "Notices confusion points and fixes them fast",
      "Strong presentation clarity and empathy for end users",
      "Iterates quickly with feedback",
      "Great at \"what the user will misunderstand\"",
    ],
    bestUsedFor: [
      "Improving dashboard layout, flow, labeling, and usability",
      "Turning complex results into clear executive narrative",
      "Enhancing adoption: training guides, tooltips, examples",
      "Refining user-facing definitions to reduce confusion",
      "Rapid prototyping for stakeholder feedback",
    ],
    watchOutFor: [
      "Prioritizing polish over correctness",
      "Making changes without strong validation",
      "Getting stuck in feedback loops without closure",
    ],
    howToSupportYou: [
      "Pair with QA to validate accuracy",
      "Provide real user feedback quickly",
      "Timebox iterations with clear decision owners",
    ],
    howToContributeIfNotPrimary: [
      "Provide technical validation and accuracy checks",
      "Help identify edge cases and potential data quality issues",
      "Contribute to documentation and training materials",
      "Support coordination and communication with stakeholders",
      "Assist with root cause analysis when issues arise",
    ],
  },
  QA: {
    roleLabel: "QA-Focused Analyst",
    strengths: [
      "Catches errors and inconsistencies early",
      "Thinks in edge cases and \"what could break\"",
      "Methodical, repeatable verification",
      "Protects trust in reporting",
      "Prevents rework by validating before release",
    ],
    bestUsedFor: [
      "Building validation checklists for changes",
      "Regression testing: \"did we break anything else?\"",
      "Defining acceptance criteria and sanity checks",
      "Data quality checks and anomaly detection",
      "Ensuring definitions are consistent across modules",
    ],
    watchOutFor: [
      "Slowing delivery when the risk is low",
      "Over-testing low-impact changes",
      "Needing clearer priorities when everything feels risky",
    ],
    howToSupportYou: [
      "Define risk tier (low/med/high) per change",
      "Provide clear acceptance criteria",
      "Give authority to block releases when necessary",
    ],
    howToContributeIfNotPrimary: [
      "Help improve usability and clarity of outputs",
      "Contribute to coordination and stakeholder communication",
      "Assist with root cause analysis and investigation",
      "Support documentation and knowledge sharing",
      "Provide domain expertise and business context",
    ],
  },
  PM: {
    roleLabel: "PM/Ops-Focused Analyst",
    strengths: [
      "Prioritizes under pressure",
      "Clarifies scope and prevents chaos",
      "Spots operational risks early",
      "Strong coordination and communication",
      "Converts ambiguity into a plan",
    ],
    bestUsedFor: [
      "Coordinating work, owners, timelines, and releases",
      "Managing backlog, triage, and stakeholder comms",
      "Setting definitions, SLAs, and \"what matters most\"",
      "Running post-issue reviews and prevention actions",
      "Ensuring changes are controlled, documented, and sustainable",
    ],
    watchOutFor: [
      "Over-coordinating and under-executing",
      "Prioritizing process over outcomes",
      "Avoiding deep dives when a root cause is needed",
    ],
    howToSupportYou: [
      "Assign clear technical owners for investigations",
      "Provide visibility into constraints and effort",
      "Agree on decision rules (what blocks release, what doesn't)",
    ],
    howToContributeIfNotPrimary: [
      "Take on technical investigations and root cause analysis",
      "Help improve outputs for clarity and usability",
      "Support validation and quality assurance efforts",
      "Contribute domain expertise and user perspective",
      "Assist with documentation and knowledge transfer",
    ],
  },
};

/**
 * Get playbook for a specific role
 */
export function getRolePlaybook(roleId: RoleId): RolePlaybook {
  return ROLE_PLAYBOOKS[roleId];
}

/**
 * Get playbook for a role string (handles "BE + FE" format)
 */
export function getRolePlaybookByString(roleString: string): RolePlaybook | null {
  // Handle "Role1 + Role2" format by using the first role
  if (roleString.includes(" + ")) {
    const [firstRole] = roleString.split(" + ") as [RoleId];
    return ROLE_PLAYBOOKS[firstRole] || null;
  }
  
  return ROLE_PLAYBOOKS[roleString as RoleId] || null;
}
