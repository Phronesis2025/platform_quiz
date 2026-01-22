"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

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

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Name",
      "Team",
      "Primary Role",
      "Secondary Role",
      "Score Spread",
      "BE Score",
      "FE Score",
      "QA Score",
      "PM Score",
    ];

    const rows = filteredSubmissions.map((sub) => [
      new Date(sub.createdAt).toLocaleString(),
      sub.name || "",
      sub.team || "",
      formatRoleLabel(sub.primaryRole),
      sub.secondaryRole ? ROLES[sub.secondaryRole as RoleId]?.label || sub.secondaryRole : "",
      sub.scoreSpread.toString(),
      sub.totals.BE.toString(),
      sub.totals.FE.toString(),
      sub.totals.QA.toString(),
      sub.totals.PM.toString(),
    ]);

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
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Home
          </Link>
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
            {filteredSubmissions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
              >
                Export to CSV
              </button>
            )}
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
                      Primary Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Secondary Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Score Spread
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {formatRoleLabel(submission.primaryRole)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {submission.secondaryRole ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            {ROLES[submission.secondaryRole as RoleId]?.label || submission.secondaryRole}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{submission.scoreSpread}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">pts</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/result/${submission.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary statistics */}
        {filteredSubmissions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    const roleCounts: Record<string, number> = {};
                    filteredSubmissions.forEach((s) => {
                      const roles = s.primaryRole.includes(" + ")
                        ? s.primaryRole.split(" + ")
                        : [s.primaryRole];
                      roles.forEach((r) => {
                        roleCounts[r] = (roleCounts[r] || 0) + 1;
                      });
                    });
                    const mostCommon = Object.entries(roleCounts).sort(
                      (a, b) => b[1] - a[1]
                    )[0];
                    return mostCommon
                      ? ROLES[mostCommon[0] as RoleId]?.label || mostCommon[0]
                      : "—";
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
