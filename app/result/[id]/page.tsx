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
          <div className="text-center mb-8 print:mb-6">
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

          {/* Ranked Roles 1-4 */}
          <div className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
              Role Rankings
            </h2>
            <div className="space-y-3 print:space-y-2">
              {rankedRoles.map((ranked) => {
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
                  <div key={ranked.roleId} className="print:break-inside-avoid">
                    <div className="flex items-center justify-between mb-2 print:mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 print:text-xs">
                          #{ranked.rank}
                        </span>
                        <span className="font-semibold text-gray-900 text-base print:text-sm">
                          {ranked.role.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium print:text-xs ${
                            isPrimary
                              ? "bg-blue-600 text-white"
                              : isSecondary
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {ranked.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 print:text-base">
                        {ranked.score} pts
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 print:h-3">
                      <div
                        className={`h-4 print:h-3 rounded-full ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your Strongest Signals */}
          {topSkillTags.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                Your Strongest Signals
              </h2>
              <div className="flex flex-wrap gap-2 print:gap-1.5">
                {topSkillTags.map((tag, index) => {
                  const frequency =
                    result.scoring.skillProfile?.tagFrequency[tag] || 1;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 print:px-2 print:py-1 print:text-xs print:bg-blue-50 print:border print:border-blue-200"
                    >
                      {tag}
                      {frequency > 1 && (
                        <span className="ml-1.5 text-xs opacity-75 print:hidden">
                          ({frequency})
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence from Your Choices */}
          {evidenceHighlights.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                Evidence from Your Choices
              </h2>
              <div className="space-y-4 print:space-y-3">
                {evidenceHighlights.slice(0, 5).map((highlight, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-5 print:p-4 print:bg-white print:border print:border-gray-200 print:break-inside-avoid"
                  >
                    <p className="text-gray-700 leading-relaxed print:text-sm">
                      {highlight.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to Use You on This Project */}
          {howToUseYou.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                How to Use You on This Project
              </h2>
              <div className="bg-green-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-green-200">
                <ul className="space-y-3 print:space-y-2">
                  {howToUseYou.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 print:gap-2"
                    >
                      <span className="text-green-600 font-bold mt-1 print:mt-0.5 print:text-sm">
                        •
                      </span>
                      <span className="text-gray-700 flex-1 print:text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Software to Explore Next */}
          {primarySoftware && primarySoftware.learnFirst.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                Software to Explore Based on Your Role
              </h2>
              <div className="bg-purple-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-purple-200">
                <p className="text-sm text-gray-700 mb-4 print:text-sm">
                  Based on your strongest role fit and the software requirements
                  document, these are the tools we recommend you start learning.
                  Begin with the first list, then move into the &quot;next&quot;
                  tools as you get comfortable.
                </p>

                <div className="grid md:grid-cols-2 gap-6 print:gap-4">
                  {/* Primary role software */}
                  <div className="print:break-inside-avoid">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 print:text-sm">
                      Focus tools for your primary role
                    </h3>
                    <ul className="space-y-2 print:space-y-1.5">
                      {primarySoftware.learnFirst.map((tool, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-700 print:text-sm"
                        >
                          <span className="mt-1 text-purple-600 font-bold print:text-xs">
                            •
                          </span>
                          <span className="flex-1">{tool}</span>
                        </li>
                      ))}
                    </ul>

                    {primarySoftware.nextSteps.length > 0 && (
                      <>
                        <h4 className="mt-4 text-sm font-semibold text-gray-900 print:text-xs">
                          Once you&apos;re comfortable, grow into:
                        </h4>
                        <ul className="mt-2 space-y-2 print:space-y-1.5">
                          {primarySoftware.nextSteps.map((tool, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-gray-700 print:text-sm"
                            >
                              <span className="mt-1 text-purple-600 font-bold print:text-xs">
                                •
                              </span>
                              <span className="flex-1">{tool}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Secondary role software (optional, short list) */}
                  {secondarySoftware &&
                    (secondarySoftware.learnFirst.length > 0 ||
                      secondarySoftware.nextSteps.length > 0) && (
                      <div className="print:break-inside-avoid">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 print:text-sm">
                          Optional tools from your secondary fit
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 print:text-xs">
                          Use these if you want to stretch into your
                          second-strongest role.
                        </p>
                        <ul className="space-y-2 print:space-y-1.5">
                          {[...secondarySoftware.learnFirst]
                            .slice(0, 4)
                            .map((tool, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-gray-700 print:text-sm"
                              >
                                <span className="mt-1 text-purple-600 font-bold print:text-xs">
                                  •
                                </span>
                                <span className="flex-1">{tool}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Watch-outs */}
          {primaryPlaybook && primaryPlaybook.watchOutFor.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                Watch-outs
              </h2>
              <div className="bg-amber-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-amber-200">
                <ul className="space-y-3 print:space-y-2">
                  {primaryPlaybook.watchOutFor.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 print:gap-2"
                    >
                      <span className="text-amber-600 font-bold mt-1 print:mt-0.5 print:text-sm">
                        •
                      </span>
                      <span className="text-gray-700 flex-1 print:text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* How to Contribute If Not Primary Fit */}
          {primaryPlaybook &&
            primaryPlaybook.howToContributeIfNotPrimary &&
            primaryPlaybook.howToContributeIfNotPrimary.length > 0 && (
              <div className="mb-8 print:mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                  How to Contribute If You&apos;re NOT the Primary Fit
                </h2>
                <div className="bg-blue-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-blue-200">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 print:text-xs italic">
                    Even if this isn&apos;t your primary role fit, you still
                    have valuable contributions to make. Here&apos;s how you can
                    add value:
                  </p>
                  <ul className="space-y-3 print:space-y-2">
                    {primaryPlaybook.howToContributeIfNotPrimary.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 print:gap-2"
                        >
                          <span className="text-blue-600 font-bold mt-1 print:mt-0.5 print:text-sm">
                            •
                          </span>
                          <span className="text-gray-700 flex-1 print:text-sm">
                            {item}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-300 print:border-gray-400">
            <div className="bg-gray-50 rounded-lg p-4 print:p-3 print:bg-white print:border print:border-gray-300">
              <p className="text-sm text-gray-600 text-center print:text-xs">
                <strong>Note:</strong> This is guidance for team composition and
                project planning, not a performance evaluation.
              </p>
            </div>
            <div className="no-print mt-4 text-center text-sm text-gray-500">
              <p>Completed: {new Date(result.timestamp).toLocaleString()}</p>
              <p className="mt-2">
                Share this result:{" "}
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
