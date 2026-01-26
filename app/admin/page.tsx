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
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
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

  // Get unique teams and roles for filter dropdowns
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    submissions.forEach((sub) => {
      if (sub.team) teams.add(sub.team);
    });
    return Array.from(teams).sort();
  }, [submissions]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    submissions.forEach((sub) => {
      if (sub.primaryRole) {
        // Handle "Role1 + Role2" format
        if (sub.primaryRole.includes(" + ")) {
          sub.primaryRole.split(" + ").forEach((role) => roles.add(role));
        } else {
          roles.add(sub.primaryRole);
        }
      }
    });
    return Array.from(roles).sort();
  }, [submissions]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (teamFilter && sub.team !== teamFilter) return false;
      if (roleFilter) {
        // Check if primary role matches (handles "Role1 + Role2" format)
        const primaryRoles = sub.primaryRole.includes(" + ")
          ? sub.primaryRole.split(" + ")
          : [sub.primaryRole];
        if (!primaryRoles.includes(roleFilter)) return false;
      }
      return true;
    });
  }, [submissions, teamFilter, roleFilter]);

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

  // Calculate aggregate role counts
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
        primaryCounts[sub.primaryRole] = (primaryCounts[sub.primaryRole] || 0) + 1;
      }

      // Count secondary roles
      if (sub.secondaryRole) {
        secondaryCounts[sub.secondaryRole] = (secondaryCounts[sub.secondaryRole] || 0) + 1;
      }
    });

    return { primaryCounts, secondaryCounts };
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
        sub.secondaryRole ? ROLES[sub.secondaryRole as RoleId]?.label || sub.secondaryRole : "",
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
    link.setAttribute("download", `role-fit-submissions-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-gray-600 dark:text-gray-400">Loading submissions...</div>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Role Fit Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Explore team role fit patterns to help with staffing and team composition decisions.
              </p>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Note:</strong> This is guidance, not a performance evaluation. 
                  Use these insights to understand team strengths and plan development opportunities.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {filteredSubmissions.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  Export to CSV
                </button>
              )}
              {submissions.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  Clear All Data
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="team-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Filter by Team
              </label>
              <select
                id="team-filter"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Teams</option>
                {uniqueTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="role-filter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Filter by Primary Role
              </label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {ROLES[role as RoleId]?.label || role}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(teamFilter || roleFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </span>
              <button
                onClick={() => {
                  setTeamFilter("");
                  setRoleFilter("");
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Primary + Secondary Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Top 3 Skills
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      BE Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      FE Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      QA Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PM Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      View Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {submission.name || (
                          <span className="text-gray-400 italic">Anonymous</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {submission.team || (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {formatRoleLabel(submission.primaryRole)}
                          </span>
                          {submission.secondaryRole && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              {ROLES[submission.secondaryRole as RoleId]?.label || submission.secondaryRole}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {getTopSkillTags(submission).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getTopSkillTags(submission).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{submission.totals.BE}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">pts</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{submission.totals.FE}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">pts</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{submission.totals.QA}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">pts</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{submission.totals.PM}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">pts</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
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

        {/* Aggregate View: Role Distribution */}
        {filteredSubmissions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Team Balance Overview
            </h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Submissions
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredSubmissions.length}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Unique Teams
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(filteredSubmissions.map((s) => s.team).filter(Boolean)).size}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Avg Score Spread
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(
                    filteredSubmissions.reduce((sum, s) => sum + s.scoreSpread, 0) /
                      filteredSubmissions.length
                  )}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Most Common Role
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {(() => {
                    const mostCommon = Object.entries(roleCounts.primaryCounts).sort(
                      (a, b) => b[1] - a[1]
                    )[0];
                    return mostCommon
                      ? ROLES[mostCommon[0] as RoleId]?.label || mostCommon[0]
                      : "—";
                  })()}
                </div>
              </div>
            </div>

            {/* Primary Role Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Primary Role Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(["BE", "FE", "QA", "PM"] as RoleId[]).map((roleId) => {
                  const count = roleCounts.primaryCounts[roleId] || 0;
                  const percentage = filteredSubmissions.length > 0
                    ? Math.round((count / filteredSubmissions.length) * 100)
                    : 0;
                  const maxCount = Math.max(...Object.values(roleCounts.primaryCounts), 1);
                  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={roleId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {ROLES[roleId].label}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {percentage}% of submissions
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary Role Distribution */}
            {Object.keys(roleCounts.secondaryCounts).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Secondary Role Distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(["BE", "FE", "QA", "PM"] as RoleId[]).map((roleId) => {
                    const count = roleCounts.secondaryCounts[roleId] || 0;
                    const totalWithSecondary = Object.values(roleCounts.secondaryCounts).reduce(
                      (sum, c) => sum + c,
                      0
                    );
                    const percentage = totalWithSecondary > 0
                      ? Math.round((count / totalWithSecondary) * 100)
                      : 0;
                    const maxCount = Math.max(...Object.values(roleCounts.secondaryCounts), 1);
                    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                    return (
                      <div key={roleId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {ROLES[roleId].label}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage}% of secondary roles
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                  Are you sure you want to delete all {submissions.length} submission(s)? This action cannot be undone.
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
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Submission Details
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.name || "Anonymous"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Team:</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.team || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedSubmission.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Score Spread:</span>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.scoreSpread} pts</p>
                    </div>
                  </div>
                </div>

                {/* Role Rankings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Role Rankings
                  </h3>
                  <div className="space-y-2">
                    {selectedSubmission.rankedRoles
                      .sort((a, b) => a.rank - b.rank)
                      .map((ranked) => {
                        const role = ROLES[ranked.roleId];
                        const maxScore = Math.max(...Object.values(selectedSubmission.totals));
                        const percentage = maxScore > 0 ? Math.round((ranked.score / maxScore) * 100) : 0;
                        const isPrimary = ranked.roleId === (selectedSubmission.primaryRole.includes(" + ")
                          ? selectedSubmission.primaryRole.split(" + ")[0]
                          : selectedSubmission.primaryRole);
                        const isSecondary = ranked.roleId === selectedSubmission.secondaryRole;

                        return (
                          <div key={ranked.roleId} className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                              #{ranked.rank}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white w-32">
                              {role.label}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full ${
                                  isPrimary
                                    ? "bg-blue-600"
                                    : isSecondary
                                    ? "bg-indigo-500"
                                    : "bg-gray-400"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white w-16 text-right">
                              {ranked.score} pts
                            </span>
                            {(isPrimary || isSecondary) && (
                              <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {isPrimary ? "Primary" : "Secondary"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Top Skills */}
                {selectedSubmission.skillProfile && getTopSkillTags(selectedSubmission).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Top Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getTopSkillTags(selectedSubmission).map((tag, idx) => {
                        const frequency = selectedSubmission.skillProfile!.tagFrequency[tag] || 1;
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag}
                            {frequency > 1 && (
                              <span className="ml-1.5 text-xs opacity-75">({frequency})</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evidence Highlights */}
                {selectedSubmission.evidenceHighlights && selectedSubmission.evidenceHighlights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Evidence from Choices
                    </h3>
                    <div className="space-y-3">
                      {selectedSubmission.evidenceHighlights.slice(0, 5).map((highlight, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                        >
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {highlight.evidence}
                          </p>
                          {highlight.signals && highlight.signals.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {highlight.signals.map((signal, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                >
                                  {signal}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {(selectedSubmission.primaryRecommendations || selectedSubmission.secondaryRecommendations) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Recommendations
                    </h3>
                    <div className="space-y-4">
                      {selectedSubmission.primaryRecommendations && selectedSubmission.primaryRecommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Primary Role:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                            {selectedSubmission.primaryRecommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedSubmission.secondaryRecommendations && selectedSubmission.secondaryRecommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Secondary Role:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                            {selectedSubmission.secondaryRecommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Text */}
                {selectedSubmission.summaryText && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Summary
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedSubmission.summaryText}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/result/${selectedSubmission.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    View Full Result Page
                  </Link>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
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
