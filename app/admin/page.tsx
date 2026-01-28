"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLES, type RoleId } from "@/src/lib/quiz";
import {
  getRolePlaybookByString,
  getRolePlaybook,
} from "@/src/lib/rolePlaybooks";

// Type definition for submission
interface Submission {
  id: string;
  createdAt: string;
  name: string | null;
  team: string | null;
  primaryRole: string;
  secondaryRole: string | null;
  totals: Record<RoleId, number>;
  rankedRoles: Array<{ roleId: RoleId; score: number; rank: number }>;
  scoreSpread: number;
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
  summaryText?: string;
  dominanceScore?: number;
  confidenceBand?: "Strong" | "Clear" | "Split" | "Hybrid";
  bonusQuestionsShown?: number[];
}

export default function AdminPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Fetch all submissions from API
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/submissions");

        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        // Fallback to empty array
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Use all submissions (no filtering)
  const filteredSubmissions = submissions;

  // Format role label for display
  const formatRoleLabel = (roleString: string): string => {
    if (roleString.includes(" + ")) {
      return roleString
        .split(" + ")
        .map((r) => ROLES[r as RoleId]?.label || r)
        .join(" + ");
    }
    return ROLES[roleString as RoleId]?.label || roleString;
  };

  // Get top 3 skill tags from a submission
  const getTopSkillTags = (submission: Submission): string[] => {
    if (!submission.skillProfile || !submission.skillProfile.tags) {
      return [];
    }
    return [...submission.skillProfile.tags]
      .sort((a, b) => {
        const freqA = submission.skillProfile!.tagFrequency[a] || 0;
        const freqB = submission.skillProfile!.tagFrequency[b] || 0;
        if (freqB !== freqA) {
          return freqB - freqA;
        }
        return a.localeCompare(b);
      })
      .slice(0, 3);
  };

  // Calculate aggregate role counts and confidence bands
  const roleCounts = useMemo(() => {
    const primaryCounts: Record<string, number> = {};
    const secondaryCounts: Record<string, number> = {};
    const confidenceBandCounts: Record<string, number> = {
      Strong: 0,
      Clear: 0,
      Split: 0,
      Hybrid: 0,
    };

    filteredSubmissions.forEach((sub) => {
      // Count primary roles (handle "Role1 + Role2" format)
      if (sub.primaryRole.includes(" + ")) {
        sub.primaryRole.split(" + ").forEach((role) => {
          primaryCounts[role] = (primaryCounts[role] || 0) + 1;
        });
      } else {
        primaryCounts[sub.primaryRole] =
          (primaryCounts[sub.primaryRole] || 0) + 1;
      }

      // Count secondary roles
      if (sub.secondaryRole) {
        secondaryCounts[sub.secondaryRole] =
          (secondaryCounts[sub.secondaryRole] || 0) + 1;
      }

      // Count confidence bands
      if (sub.confidenceBand) {
        confidenceBandCounts[sub.confidenceBand] =
          (confidenceBandCounts[sub.confidenceBand] || 0) + 1;
      }
    });

    return { primaryCounts, secondaryCounts, confidenceBandCounts };
  }, [filteredSubmissions]);

  // Generate risk & coverage insights automatically
  const riskInsights = useMemo(() => {
    const insights: string[] = [];
    const totalPeople = filteredSubmissions.length;

    if (totalPeople === 0) return insights;

    // Check for role concentration risks
    const roleEntries = Object.entries(roleCounts.primaryCounts);
    const sortedRoles = roleEntries.sort((a, b) => b[1] - a[1]);

    // Risk: QA concentration
    const qaCount = roleCounts.primaryCounts["QA"] || 0;
    if (qaCount <= 2 && qaCount > 0) {
      insights.push(
        `QA-style thinking is concentrated in ${qaCount} individual${qaCount === 1 ? "" : "s"} → elevated release risk`,
      );
    }

    // Risk: Backend + PM overlap (burnout risk)
    const beWithPmSecondary = filteredSubmissions.filter(
      (sub) =>
        (sub.primaryRole === "BE" || sub.primaryRole.includes("BE")) &&
        sub.secondaryRole === "PM",
    ).length;
    if (beWithPmSecondary > 0) {
      insights.push(
        `Most Backend-aligned individuals also show secondary PM traits → good for ownership, but watch burnout`,
      );
    }

    // Risk: FE as secondary only
    const fePrimary = roleCounts.primaryCounts["FE"] || 0;
    const feSecondary = roleCounts.secondaryCounts["FE"] || 0;
    if (fePrimary === 0 && feSecondary > 0) {
      insights.push(
        `FE alignment is present but often secondary → usability may be underrepresented`,
      );
    }

    // Risk: Missing role coverage
    const allRoles = ["BE", "FE", "QA", "PM"] as RoleId[];
    const missingRoles = allRoles.filter(
      (role) => (roleCounts.primaryCounts[role] || 0) === 0,
    );
    if (missingRoles.length > 0) {
      const roleLabels = missingRoles.map((r) => ROLES[r].label).join(", ");
      insights.push(
        `No primary ${roleLabels} alignment detected → consider coverage gaps`,
      );
    }

    // Risk: Low confidence assignments
    const lowConfidence =
      (roleCounts.confidenceBandCounts["Split"] || 0) +
      (roleCounts.confidenceBandCounts["Hybrid"] || 0);
    if (lowConfidence > totalPeople * 0.3) {
      insights.push(
        `${lowConfidence} individuals show Split/Hybrid confidence → consider additional context for role assignments`,
      );
    }

    return insights.slice(0, 4); // Return top 4 insights
  }, [filteredSubmissions, roleCounts]);

  // Generate leadership translation
  const leadershipTranslation = useMemo(() => {
    if (filteredSubmissions.length === 0) return "";

    const sortedRoles = Object.entries(roleCounts.primaryCounts).sort(
      (a, b) => b[1] - a[1],
    );
    const topRole = sortedRoles[0];
    const secondRole = sortedRoles[1];
    const thirdRole = sortedRoles[2];

    const topLabel = topRole
      ? ROLES[topRole[0] as RoleId]?.label || topRole[0]
      : "";
    const secondLabel = secondRole
      ? ROLES[secondRole[0] as RoleId]?.label || secondRole[0]
      : "";
    const thirdLabel = thirdRole
      ? ROLES[thirdRole[0] as RoleId]?.label || thirdRole[0]
      : "";

    const topCount = topRole?.[1] || 0;
    const secondCount = secondRole?.[1] || 0;
    const thirdCount = thirdRole?.[1] || 0;

    let depth = "strong";
    if (topCount <= 2) depth = "limited";
    else if (topCount <= filteredSubmissions.length * 0.4) depth = "moderate";

    let coverage = "moderate";
    if (secondCount === 0) coverage = "limited";
    else if (secondCount >= filteredSubmissions.length * 0.3)
      coverage = "strong";

    let redundancy = "good";
    if (topCount === 1 && secondCount === 0) redundancy = "limited";
    else if (topCount <= 2 && secondCount <= 1) redundancy = "moderate";

    return `The team shows ${depth} depth in ${topLabel}, ${coverage} coverage in ${secondLabel || "secondary roles"}, and ${redundancy} redundancy${redundancy === "limited" ? " → consider cross-training" : ""}.`;
  }, [filteredSubmissions, roleCounts]);

  // Team composition analysis
  const teamComposition = useMemo(() => {
    const teams: Record<
      string,
      {
        members: Submission[];
        roleBreakdown: Record<string, number>;
        totalMembers: number;
      }
    > = {};

    filteredSubmissions.forEach((sub) => {
      const team = sub.team || "Unassigned";
      if (!teams[team]) {
        teams[team] = {
          members: [],
          roleBreakdown: {},
          totalMembers: 0,
        };
      }
      teams[team].members.push(sub);
      teams[team].totalMembers++;

      // Count roles per team
      const primaryRoles = sub.primaryRole.includes(" + ")
        ? sub.primaryRole.split(" + ")
        : [sub.primaryRole];
      primaryRoles.forEach((role) => {
        teams[team].roleBreakdown[role] =
          (teams[team].roleBreakdown[role] || 0) + 1;
      });
    });

    return teams;
  }, [filteredSubmissions]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Redirect to login page
        router.push("/admin/login");
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  // Handle clear all data
  const handleClearAllData = async () => {
    setIsClearingData(true);
    try {
      const response = await fetch("/api/admin/clear-data", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the page to show empty state
        window.location.reload();
      } else {
        console.error("Failed to clear data:", data.error);
        alert(`Failed to clear data: ${data.error || "Unknown error"}`);
        setIsClearingData(false);
        setShowClearConfirm(false);
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("An error occurred while clearing data. Please try again.");
      setIsClearingData(false);
      setShowClearConfirm(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Name",
      "Team",
      "Primary Role",
      "Secondary Role",
      "Role Rank 1",
      "Role Rank 2",
      "Role Rank 3",
      "Role Rank 4",
      "Top Skill 1",
      "Top Skill 2",
      "Top Skill 3",
      "Score Spread",
      "BE Score",
      "FE Score",
      "QA Score",
      "PM Score",
    ];

    const rows = filteredSubmissions.map((sub) => {
      const topSkills = getTopSkillTags(sub);
      const rankedRoles = sub.rankedRoles
        .sort((a, b) => a.rank - b.rank)
        .map((r) => ROLES[r.roleId]?.label || r.roleId);

      return [
        new Date(sub.createdAt).toLocaleString(),
        sub.name || "",
        sub.team || "",
        formatRoleLabel(sub.primaryRole),
        sub.secondaryRole
          ? ROLES[sub.secondaryRole as RoleId]?.label || sub.secondaryRole
          : "",
        rankedRoles[0] || "",
        rankedRoles[1] || "",
        rankedRoles[2] || "",
        rankedRoles[3] || "",
        topSkills[0] || "",
        topSkills[1] || "",
        topSkills[2] || "",
        sub.scoreSpread.toString(),
        sub.totals.BE.toString(),
        sub.totals.FE.toString(),
        sub.totals.QA.toString(),
        sub.totals.PM.toString(),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `role-fit-submissions-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-600 dark:text-gray-400">
          Loading submissions...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Home
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* SECTION 1 — Executive Framing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Team Role Alignment – Operational Support Context
              </h1>
            </div>
            <div className="flex gap-2">
              {filteredSubmissions.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Export CSV
                </button>
              )}
              {submissions.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Clear Data
                </button>
              )}
            </div>
          </div>

          {/* Non-negotiable context paragraph */}
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
              <strong>Context:</strong> This tool identifies how individuals
              naturally approach problem-solving, risk, and delivery under
              pressure. It is not a performance evaluation and does not override
              job titles. Results are intended to reduce operational risk by
              aligning responsibilities with demonstrated thinking patterns.
            </p>
          </div>
        </div>

        {/* SECTION 2 — Team-Level Snapshot (aggregate only, no names) */}
        {filteredSubmissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team-Level Snapshot
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Primary Role Distribution */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Primary Role Distribution
                </h3>
                <div className="space-y-2">
                  {(["BE", "FE", "QA", "PM"] as RoleId[]).map((roleId) => {
                    const count = roleCounts.primaryCounts[roleId] || 0;
                    return (
                      <div
                        key={roleId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {ROLES[roleId].label}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Role Distribution */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Secondary Role Distribution
                </h3>
                <div className="space-y-2">
                  {(["BE", "FE", "QA", "PM"] as RoleId[]).map((roleId) => {
                    const count = roleCounts.secondaryCounts[roleId] || 0;
                    return (
                      <div
                        key={roleId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {ROLES[roleId].label}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confidence Bands Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Confidence Bands Breakdown
                </h3>
                <div className="space-y-2">
                  {(["Strong", "Clear", "Split", "Hybrid"] as const).map(
                    (band) => {
                      const count = roleCounts.confidenceBandCounts[band] || 0;
                      return (
                        <div
                          key={band}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {band}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            {/* Leadership Translation */}
            {leadershipTranslation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded mt-4">
                <p className="text-sm text-gray-900 dark:text-white italic">
                  {leadershipTranslation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3 — Risk & Coverage Insights */}
        {filteredSubmissions.length > 0 && riskInsights.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk & Coverage Insights
            </h2>
            <div className="space-y-3">
              {riskInsights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded"
                >
                  <p className="text-sm text-gray-900 dark:text-white">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4 — Individual Results Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {submissions.length === 0
                ? "No assessments completed yet. Complete an assessment to see results here."
                : "No submissions match your filters."}
            </p>
            {submissions.length === 0 && (
              <Link
                href="/quiz"
                className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Start Assessment →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Individual Results
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click &quot;View Details&quot; to see full role fit profile and
                recommendations.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Primary Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Secondary Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Confidence Band
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Dominance Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Top 3 Skill Signals
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {submission.name || (
                          <span className="text-gray-400 italic text-xs">
                            Anonymous
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {formatRoleLabel(submission.primaryRole)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {submission.secondaryRole ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            {ROLES[submission.secondaryRole as RoleId]?.label ||
                              submission.secondaryRole}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {submission.confidenceBand ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {submission.confidenceBand}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {submission.dominanceScore !== undefined ? (
                          <span className="font-medium">
                            {submission.dominanceScore} pts
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {getTopSkillTags(submission).length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {getTopSkillTags(submission)
                              .slice(0, 3)
                              .map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clear Data Confirmation Modal */}
        {showClearConfirm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isClearingData && setShowClearConfirm(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Clear All Data
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete all {submissions.length}{" "}
                  submission(s)? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    disabled={isClearingData}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAllData}
                    disabled={isClearingData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    {isClearingData ? "Deleting..." : "Delete All"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedSubmission.name || "Anonymous"} -{" "}
                  {formatRoleLabel(selectedSubmission.primaryRole)}
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Name
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.name || "Anonymous"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Team
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.team || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Confidence Band
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.confidenceBand || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Dominance Score
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.dominanceScore !== undefined
                        ? `${selectedSubmission.dominanceScore} pts`
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Role Rankings */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Role Rankings
                  </h3>
                  <div className="space-y-2">
                    {selectedSubmission.rankedRoles
                      .sort((a, b) => a.rank - b.rank)
                      .map((ranked) => {
                        const role = ROLES[ranked.roleId];
                        const maxScore = Math.max(
                          ...Object.values(selectedSubmission.totals),
                        );
                        const percentage =
                          maxScore > 0
                            ? Math.round((ranked.score / maxScore) * 100)
                            : 0;
                        const isPrimary =
                          ranked.roleId ===
                          (selectedSubmission.primaryRole.includes(" + ")
                            ? selectedSubmission.primaryRole.split(" + ")[0]
                            : selectedSubmission.primaryRole);
                        const isSecondary =
                          ranked.roleId === selectedSubmission.secondaryRole;

                        return (
                          <div
                            key={ranked.roleId}
                            className="flex items-center gap-3"
                          >
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-6">
                              #{ranked.rank}
                            </span>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white w-28">
                              {role.label}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  isPrimary
                                    ? "bg-blue-600"
                                    : isSecondary
                                      ? "bg-indigo-500"
                                      : "bg-gray-400"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white w-12 text-right">
                              {ranked.score}
                            </span>
                            {(isPrimary || isSecondary) && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {isPrimary ? "P" : "S"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Skill Evidence */}
                {selectedSubmission.skillProfile &&
                  getTopSkillTags(selectedSubmission).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Skill Evidence
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {getTopSkillTags(selectedSubmission).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Best Used For */}
                {(selectedSubmission.primaryRecommendations ||
                  selectedSubmission.secondaryRecommendations) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Best Used For
                    </h3>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                      {selectedSubmission.primaryRecommendations
                        ?.slice(0, 5)
                        .map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                              •
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      {selectedSubmission.secondaryRecommendations
                        ?.slice(0, 2)
                        .map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">
                              •
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Watch-outs (Risk Conditions) */}
                {(() => {
                  const primaryPlaybook = getRolePlaybookByString(
                    selectedSubmission.primaryRole,
                  );
                  return (
                    primaryPlaybook &&
                    primaryPlaybook.watchOutFor.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Risk Conditions to Monitor
                        </h3>
                        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          {primaryPlaybook.watchOutFor.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-600 dark:text-amber-400 mt-0.5">
                                •
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  );
                })()}

                {/* How to Support */}
                {(() => {
                  const primaryPlaybook = getRolePlaybookByString(
                    selectedSubmission.primaryRole,
                  );
                  return (
                    primaryPlaybook &&
                    primaryPlaybook.howToSupportYou.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          How to Support
                        </h3>
                        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          {primaryPlaybook.howToSupportYou.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">
                                •
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/result/${selectedSubmission.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    View Full Result
                  </Link>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6 — Explicit Guardrails Footer */}
        {filteredSubmissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6 border-t-4 border-red-500">
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
              <strong>Guardrails:</strong> These results should be used to guide
              task assignment and risk mitigation, not to limit growth,
              promotion, or learning opportunities. Individuals may
              intentionally stretch beyond their primary fit with appropriate
              support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
