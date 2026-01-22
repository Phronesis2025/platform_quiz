"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ROLES, type RoleId } from "@/src/lib/quiz";

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
              localStorage.getItem("quizResults") || "[]"
            );
            const foundResult = storedResults.find(
              (r: QuizSubmission) => r.id === resultId
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
          },
          timestamp: data.timestamp,
        };

        setResult(submission);
      } catch (error) {
        console.error("Error fetching result:", error);
        
        // Fallback to localStorage
        const storedResults = JSON.parse(
          localStorage.getItem("quizResults") || "[]"
        );
        const foundResult = storedResults.find(
          (r: QuizSubmission) => r.id === resultId
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
        <div className="text-gray-600 dark:text-gray-400">Loading your results...</div>
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
    const bulletsText = narrative.substring(whyIndex + "Here's why this role fits you:".length).trim();
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

    if (typeof result.scoring.primaryRole === "string" && result.scoring.primaryRole.includes(" + ")) {
      const [role1, role2] = result.scoring.primaryRole.split(" + ") as [RoleId, RoleId];
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

  // Get all roles in fixed order (BE, FE, QA, PM)
  const allRoles: RoleId[] = ["BE", "FE", "QA", "PM"];
  const roleScores = allRoles.map((roleId) => ({
    roleId,
    role: ROLES[roleId],
    score: result.scoring.totals[roleId],
    isPrimary: roleInfo.primary.id === roleId || (roleInfo.isTie && roleInfo.secondary?.id === roleId),
    isSecondary: roleInfo.secondary?.id === roleId && !roleInfo.isTie,
  }));

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
              Role Fit Assessment
            </h1>
            {result.name && (
              <p className="text-lg text-gray-600 print:text-base">
                {result.name}
                {result.team && ` • ${result.team}`}
              </p>
            )}
          </div>

          {/* Best Fit Section */}
          <div className="mb-8 print:mb-6">
            <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-6 print:p-4 text-center">
              <p className="text-sm text-gray-600 mb-2 print:text-xs">Best Fit</p>
              <p className="text-3xl md:text-4xl font-bold text-blue-600 print:text-3xl">
                {roleInfo.primary.label}
              </p>
            </div>
          </div>

          {/* Strong Secondary Fit - if applicable */}
          {roleInfo.secondary && !roleInfo.isTie && (
            <div className="mb-8 print:mb-6">
              <div className="bg-indigo-50 border-2 border-indigo-500 rounded-lg p-6 print:p-4 text-center">
                <p className="text-sm text-gray-600 mb-2 print:text-xs">Strong Secondary Fit</p>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600 print:text-2xl">
                  {roleInfo.secondary.label}
                </p>
              </div>
            </div>
          )}

          {/* Score Breakdown - Bar Style */}
          <div className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
              Score Breakdown
            </h2>
            <div className="space-y-4 print:space-y-3">
              {roleScores.map(({ roleId, role, score, isPrimary, isSecondary }) => {
                const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                const barColor = isPrimary
                  ? "bg-blue-600"
                  : isSecondary
                  ? "bg-indigo-500"
                  : "bg-gray-300";

                return (
                  <div key={roleId} className="print:break-inside-avoid">
                    <div className="flex items-center justify-between mb-2 print:mb-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 text-base print:text-sm">
                          {role.label}
                        </span>
                        {isPrimary && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded print:hidden">
                            Best Fit
                          </span>
                        )}
                        {isSecondary && (
                          <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded print:hidden">
                            Secondary
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-gray-900 print:text-base">
                        {score} pts
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

          {/* Narrative Summary */}
          <div className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
              Summary
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-gray-200">
              <p className="text-gray-700 leading-relaxed print:text-sm">
                {summary}
              </p>
            </div>
          </div>

          {/* Why Reasons - Bullet Points */}
          {bullets.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg print:mb-3">
                Why This Role Fits You
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 print:p-4 print:bg-white print:border print:border-gray-200">
                <ul className="space-y-3 print:space-y-2">
                  {bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3 print:gap-2">
                      <span className="text-blue-600 font-bold mt-1 print:mt-0.5 print:text-sm">
                        •
                      </span>
                      <span className="text-gray-700 flex-1 print:text-sm">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer - hidden when printing */}
          <div className="no-print mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>
              Completed: {new Date(result.timestamp).toLocaleString()}
            </p>
            <p className="mt-2">
              Share this result:{" "}
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {typeof window !== "undefined" ? window.location.href : ""}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
