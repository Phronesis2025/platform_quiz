"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLES, type RoleId } from "@/src/lib/quiz";

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

  // Calculate aggregate role counts and team insights
  const roleCounts = useMemo(() => {
    const primaryCounts: Record<string, number> = {};
    const secondaryCounts: Record<string, number> = {};

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
    });

    return { primaryCounts, secondaryCounts };
  }, [filteredSubmissions]);

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

        {/* Page header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Team Role Fit Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Staffing insights and team composition analysis
              </p>
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

          {/* Contextual guidance */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                How to Use This Dashboard
              </h3>
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>
                  <strong>Team Composition:</strong> Review role distribution
                  across teams to identify gaps or over-concentration
                </li>
                <li>
                  <strong>Role Distribution:</strong> Understand overall team
                  balance and where you might need to hire or develop skills
                </li>
                <li>
                  <strong>Individual Details:</strong> Click &quot;Details&quot; on any
                  person to see their full role fit profile and recommendations
                </li>
                <li>
                  <strong>Export:</strong> Download data as CSV for further
                  analysis in spreadsheets or reporting tools
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                About Role Fit
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                These role assignments are based on quiz responses and indicate
                natural preferences and strengths. They are guidance for team
                composition and project planning,{" "}
                <strong>not performance evaluations</strong>.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Roles:</strong> {ROLES.BE.label} (BE) • {ROLES.FE.label}{" "}
                (FE) • {ROLES.QA.label} (QA) • {ROLES.PM.label} (PM)
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        {filteredSubmissions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Key Metrics
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Quick overview of your team data
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Total People
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {filteredSubmissions.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total quiz submissions
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Teams
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {
                    new Set(
                      filteredSubmissions.map((s) => s.team).filter(Boolean),
                    ).size
                  }
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Unique teams represented
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Most Common Role
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {(() => {
                    const mostCommon = Object.entries(
                      roleCounts.primaryCounts,
                    ).sort((a, b) => b[1] - a[1])[0];
                    return mostCommon
                      ? ROLES[mostCommon[0] as RoleId]?.label || mostCommon[0]
                      : "—";
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Primary role with most people
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Avg Score Spread
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {Math.round(
                    filteredSubmissions.reduce(
                      (sum, s) => sum + s.scoreSpread,
                      0,
                    ) / filteredSubmissions.length,
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Difference between highest and lowest role scores (higher =
                  more specialized)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Composition Overview */}
        {filteredSubmissions.length > 0 &&
          Object.keys(teamComposition).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Team Composition
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  See how roles are distributed across teams. This helps
                  identify teams that may need more balance or specific skill
                  sets.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(teamComposition)
                  .sort((a, b) => b[1].totalMembers - a[1].totalMembers)
                  .slice(0, 6)
                  .map(([teamName, team]) => (
                    <div
                      key={teamName}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {teamName}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {team.totalMembers}{" "}
                          {team.totalMembers === 1 ? "person" : "people"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["BE", "FE", "QA", "PM"] as RoleId[]).map(
                          (roleId) => {
                            const count = team.roleBreakdown[roleId] || 0;
                            return (
                              <div
                                key={roleId}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {ROLES[roleId].label}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {count}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Role Distribution - Compact */}
        {filteredSubmissions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Role Distribution
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Overall distribution of primary roles across all people. Use
                this to understand if your organization has balanced coverage or
                if certain roles are over/under-represented.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["BE", "FE", "QA", "PM"] as RoleId[]).map((roleId) => {
                const count = roleCounts.primaryCounts[roleId] || 0;
                const percentage =
                  filteredSubmissions.length > 0
                    ? Math.round((count / filteredSubmissions.length) * 100)
                    : 0;
                const maxCount = Math.max(
                  ...Object.values(roleCounts.primaryCounts),
                  1,
                );
                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div
                    key={roleId}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {ROLES[roleId].label}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results table */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {submissions.length === 0
                ? "No submissions yet. Take a quiz to see results here!"
                : "No submissions match your filters."}
            </p>
            {submissions.length === 0 && (
              <Link
                href="/quiz"
                className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go to Quiz →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                All Submissions
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Complete list of all quiz submissions. Click &quot;Details&quot; to see
                full role fit profile, skill tags, evidence highlights, and
                recommendations for each person.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Team
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Roles
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Top Skills
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
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
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {submission.name || (
                          <span className="text-gray-400 italic text-xs">
                            Anonymous
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {submission.team || (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {formatRoleLabel(submission.primaryRole)}
                          </span>
                          {submission.secondaryRole && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              {ROLES[submission.secondaryRole as RoleId]
                                ?.label || submission.secondaryRole}
                            </span>
                          )}
                        </div>
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
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Additional context */}
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Understanding the Data
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Role:
                  </p>
                  <p>
                    The role with the highest total score based on quiz answers.
                    This represents the person&apos;s strongest natural fit.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Role:
                  </p>
                  <p>
                    The role with the second-highest score. People often have
                    strengths in multiple areas.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Top Skills:
                  </p>
                  <p>
                    Skill tags extracted from their answers that indicate their
                    strongest signals and preferences.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Score Spread:
                  </p>
                  <p>
                    The difference between highest and lowest role scores.
                    Higher spread = more specialized, lower = more balanced.
                  </p>
                </div>
              </div>
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
                      Date
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(
                        selectedSubmission.createdAt,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Score Spread
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSubmission.scoreSpread} pts
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

                {/* Top Skills */}
                {selectedSubmission.skillProfile &&
                  getTopSkillTags(selectedSubmission).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Top Skills
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

                {/* Recommendations */}
                {(selectedSubmission.primaryRecommendations ||
                  selectedSubmission.secondaryRecommendations) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Best Use Cases
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
      </div>
    </div>
  );
}
