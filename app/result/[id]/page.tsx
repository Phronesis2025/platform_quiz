"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ROLES, type RoleId } from "@/src/lib/quiz";
import {
  getRolePlaybookByString,
  getRolePlaybook,
} from "@/src/lib/rolePlaybooks";
import {
  getRoleSoftwareByString,
  getRoleSoftware,
} from "@/src/lib/roleSoftware";

// Type definition for quiz submission
interface QuizSubmission {
  id: string;
  name: string | null;
  team: string | null;
  responses: Record<number, number | number[]>;
  scoring: {
    totals: Record<RoleId, number>;
    ranked: Array<{ roleId: RoleId; score: number; rank: number }>;
    primaryRole: RoleId | string;
    secondaryRole?: RoleId;
    tieDetected: boolean;
    narrative: string;
    skillProfile?: {
      tags: string[];
      tagFrequency: Record<string, number>;
    };
    evidenceHighlights?: Array<{
      questionId: number;
      questionPrompt: string;
      optionText: string;
      evidence: string;
      signals: string[];
      score: number;
    }>;
    primaryRecommendations?: string[];
    secondaryRecommendations?: string[];
  };
  timestamp: string;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the result ID from the URL
    const resultId = params.id as string;

    // Fetch result from API
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/submit-quiz?id=${resultId}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Result not found, try localStorage as fallback
            const storedResults = JSON.parse(
              localStorage.getItem("quizResults") || "[]",
            );
            const foundResult = storedResults.find(
              (r: QuizSubmission) => r.id === resultId,
            );

            if (foundResult) {
              setResult(foundResult);
              setLoading(false);
              return;
            }
          }

          // If not found in API or localStorage, redirect to home
          router.push("/");
          return;
        }

        const data = await response.json();

        // Transform API response to match QuizSubmission interface
        const submission: QuizSubmission = {
          id: data.id,
          name: data.name,
          team: data.team,
          responses: data.responses,
          scoring: {
            totals: data.scoring.totals,
            ranked: data.scoring.ranked,
            primaryRole: data.scoring.primaryRole,
            secondaryRole: data.scoring.secondaryRole,
            tieDetected: data.scoring.tieDetected || false,
            narrative: data.scoring.narrative,
            skillProfile: data.scoring.skillProfile,
            evidenceHighlights: data.scoring.evidenceHighlights,
            primaryRecommendations: data.scoring.primaryRecommendations,
            secondaryRecommendations: data.scoring.secondaryRecommendations,
          },
          timestamp: data.timestamp,
        };

        setResult(submission);
      } catch (error) {
        console.error("Error fetching result:", error);

        // Fallback to localStorage
        const storedResults = JSON.parse(
          localStorage.getItem("quizResults") || "[]",
        );
        const foundResult = storedResults.find(
          (r: QuizSubmission) => r.id === resultId,
        );

        if (foundResult) {
          setResult(foundResult);
        } else {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-600 dark:text-gray-400">
          Loading your results...
        </div>
      </div>
    );
  }

  if (!result) {
    return null; // Will redirect in useEffect
  }

  // Parse narrative to extract summary and bullet points
  const parseNarrative = (narrative: string) => {
    const whyIndex = narrative.indexOf("Here's why this role fits you:");
    if (whyIndex === -1) {
      return {
        summary: narrative,
        bullets: [],
      };
    }

    const summary = narrative.substring(0, whyIndex).trim();
    const bulletsText = narrative
      .substring(whyIndex + "Here's why this role fits you:".length)
      .trim();
    const bullets = bulletsText
      .split("\n")
      .map((line) => line.replace(/^•\s*/, "").trim())
      .filter((line) => line.length > 0);

    return { summary, bullets };
  };

  const { summary, bullets } = parseNarrative(result.scoring.narrative);

  // Get primary and secondary role info
  const getRoleInfo = () => {
    let primaryRoleId: RoleId;
    let secondaryRoleId: RoleId | null = null;
    let isTie = false;

    if (
      typeof result.scoring.primaryRole === "string" &&
      result.scoring.primaryRole.includes(" + ")
    ) {
      const [role1, role2] = result.scoring.primaryRole.split(" + ") as [
        RoleId,
        RoleId,
      ];
      primaryRoleId = role1;
      secondaryRoleId = role2;
      isTie = true;
    } else {
      primaryRoleId = result.scoring.primaryRole as RoleId;
      secondaryRoleId = result.scoring.secondaryRole || null;
    }

    return {
      primary: ROLES[primaryRoleId],
      secondary: secondaryRoleId ? ROLES[secondaryRoleId] : null,
      isTie,
    };
  };

  const roleInfo = getRoleInfo();
  const maxScore = Math.max(...Object.values(result.scoring.totals));

  // Get ranked roles (1-4) with labels
  const rankedRoles = result.scoring.ranked.map((ranked) => {
    const roleId = ranked.roleId;
    let label = "";
    if (roleInfo.isTie) {
      const [role1, role2] = (result.scoring.primaryRole as string).split(
        " + ",
      ) as [RoleId, RoleId];
      if (roleId === role1 || roleId === role2) {
        label = "Primary";
      } else if (ranked.rank === 3) {
        label = "Additional fit";
      } else {
        label = "Additional fit";
      }
    } else {
      if (roleId === roleInfo.primary.id) {
        label = "Primary";
      } else if (roleId === roleInfo.secondary?.id) {
        label = "Secondary";
      } else {
        label = "Additional fit";
      }
    }
    return {
      ...ranked,
      role: ROLES[roleId],
      label,
    };
  });

  // Get top 6 skill tags (sorted by frequency, then alphabetically)
  // Fallback to empty array if skillProfile is missing (for old submissions)
  const topSkillTags = result.scoring.skillProfile
    ? [...result.scoring.skillProfile.tags]
        .sort((a, b) => {
          const freqA = result.scoring.skillProfile!.tagFrequency[a] || 0;
          const freqB = result.scoring.skillProfile!.tagFrequency[b] || 0;
          if (freqB !== freqA) {
            return freqB - freqA; // Higher frequency first
          }
          return a.localeCompare(b); // Alphabetical tie-breaker
        })
        .slice(0, 6)
    : [];

  // Get evidence highlights (3-5 items)
  // Fallback to empty array if missing (for old submissions)
  const evidenceHighlights = result.scoring.evidenceHighlights || [];

  // Get role playbooks
  const primaryPlaybook = getRolePlaybookByString(result.scoring.primaryRole);
  const secondaryPlaybook = result.scoring.secondaryRole
    ? getRolePlaybook(result.scoring.secondaryRole)
    : null;

  // Get role-based software recommendations
  const primarySoftware = getRoleSoftwareByString(result.scoring.primaryRole);
  const secondarySoftware = result.scoring.secondaryRole
    ? getRoleSoftware(result.scoring.secondaryRole)
    : null;

  // Build "How to use you" section: use stored recommendations if available, otherwise compute from playbooks
  const howToUseYou: string[] = [];
  if (
    result.scoring.primaryRecommendations &&
    result.scoring.primaryRecommendations.length > 0
  ) {
    // Use stored recommendations (new format)
    howToUseYou.push(...result.scoring.primaryRecommendations);
    if (
      result.scoring.secondaryRecommendations &&
      result.scoring.secondaryRecommendations.length >= 2
    ) {
      howToUseYou.push(...result.scoring.secondaryRecommendations.slice(0, 2));
    }
  } else {
    // Fallback: compute from playbooks (for old submissions)
    if (primaryPlaybook) {
      howToUseYou.push(...primaryPlaybook.bestUsedFor);
    }
    if (secondaryPlaybook && secondaryPlaybook.bestUsedFor.length >= 2) {
      howToUseYou.push(...secondaryPlaybook.bestUsedFor.slice(0, 2));
    }
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white print:bg-white">
        {/* Navigation - hidden when printing */}
        <div className="no-print bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-4 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-4">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              ← Back to Home
            </Link>
            <Link
              href="/quiz"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Take Another Reflection
            </Link>
          </div>
        </div>

        {/* Main content - printable */}
        <div className="print-container max-w-4xl mx-auto px-6 py-8 md:py-12 print:py-8">
          {/* Header */}
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 print:text-3xl">
              Your Role Fit Profile
            </h1>
            {result.name && (
              <p className="text-lg text-gray-600 print:text-base">
                {result.name}
                {result.team && ` • ${result.team}`}
              </p>
            )}
          </div>

          {/* Primary Role Summary */}
          <div className="mb-6 print:mb-4">
            <div className="bg-blue-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-blue-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 print:text-xl">
                    {roleInfo.primary.label}
                  </h2>
                  {roleInfo.secondary && (
                    <p className="text-sm text-gray-600 mt-1 print:text-xs">
                      Secondary: {roleInfo.secondary.label}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold text-blue-600 print:text-xl">
                  {result.scoring.totals[roleInfo.primary.id]} pts
                </span>
              </div>
              <p className="text-sm text-gray-700 print:text-xs">{summary}</p>
            </div>

            {/* Top 3 Roles */}
            <div className="space-y-2 print:space-y-1.5">
              {rankedRoles.slice(0, 3).map((ranked) => {
                const percentage =
                  maxScore > 0
                    ? Math.round((ranked.score / maxScore) * 100)
                    : 0;
                const isPrimary = ranked.label === "Primary";
                const isSecondary = ranked.label === "Secondary";
                const barColor = isPrimary
                  ? "bg-blue-600"
                  : isSecondary
                    ? "bg-indigo-500"
                    : "bg-gray-400";

                return (
                  <div key={ranked.roleId} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-6 print:text-xs">
                      #{ranked.rank}
                    </span>
                    <span className="text-sm font-medium text-gray-900 flex-1 print:text-xs">
                      {ranked.role.label}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 print:h-1.5">
                      <div
                        className={`h-2 print:h-1.5 rounded-full ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right print:text-xs">
                      {ranked.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Strengths - Combined */}
          {(topSkillTags.length > 0 || evidenceHighlights.length > 0) && (
            <div className="mb-6 print:mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">
                Key Strengths
              </h2>
              {topSkillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 print:gap-1.5 print:mb-2">
                  {topSkillTags.slice(0, 6).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 print:px-2 print:py-0.5 print:text-xs print:bg-blue-50 print:border print:border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {evidenceHighlights.length > 0 && (
                <div className="space-y-2 print:space-y-1.5">
                  {evidenceHighlights.slice(0, 2).map((highlight, index) => (
                    <p
                      key={index}
                      className="text-sm text-gray-700 print:text-xs"
                    >
                      {highlight.evidence}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations - Combined */}
          <div className="mb-6 print:mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">
              Recommendations
            </h2>
            <div className="grid md:grid-cols-2 gap-4 print:gap-3">
              {/* Best Use Cases */}
              {howToUseYou.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 print:p-3 print:bg-white print:border print:border-green-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 print:text-xs">
                    Best Use Cases
                  </h3>
                  <ul className="space-y-1.5 print:space-y-1">
                    {howToUseYou.slice(0, 5).map((item, index) => (
                      <li
                        key={index}
                        className="text-xs text-gray-700 print:text-xs"
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Software to Learn */}
              {primarySoftware && primarySoftware.learnFirst.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 print:p-3 print:bg-white print:border print:border-purple-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 print:text-xs">
                    Software to Learn
                  </h3>
                  <ul className="space-y-1.5 print:space-y-1">
                    {primarySoftware.learnFirst
                      .slice(0, 5)
                      .map((tool, index) => (
                        <li
                          key={index}
                          className="text-xs text-gray-700 print:text-xs"
                        >
                          • {tool.split(" – ")[0]}
                        </li>
                      ))}
                  </ul>
                  {primarySoftware.nextSteps.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2 print:text-xs">
                      <strong>Next:</strong>{" "}
                      {primarySoftware.nextSteps
                        .slice(0, 2)
                        .map((t) => t.split(" – ")[0])
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Watch-outs */}
          {primaryPlaybook && primaryPlaybook.watchOutFor.length > 0 && (
            <div className="mb-6 print:mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 print:text-base print:mb-2">
                Watch-outs
              </h2>
              <div className="bg-amber-50 rounded-lg p-4 print:p-3 print:bg-white print:border print:border-amber-200">
                <ul className="space-y-1.5 print:space-y-1">
                  {primaryPlaybook.watchOutFor.map((item, index) => (
                    <li
                      key={index}
                      className="text-xs text-gray-700 print:text-xs"
                    >
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-300 print:border-gray-400">
            <p className="text-xs text-gray-600 text-center print:text-xs">
              <strong>Note:</strong> Guidance for team composition, not a
              performance evaluation.
            </p>
            <div className="no-print mt-3 text-center text-xs text-gray-500">
              <p>Completed: {new Date(result.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
