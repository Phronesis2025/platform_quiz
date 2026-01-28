import { NextRequest, NextResponse } from "next/server";
import { getAllSubmissions } from "@/src/lib/db";

// Force dynamic rendering - this route should never be statically generated
export const dynamic = "force-dynamic";

/**
 * GET endpoint to retrieve all submissions
 * 
 * Returns all quiz submissions sorted by creation date (newest first)
 * Used by the admin page to display all submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Get all submissions from Redis, sorted by creation date (newest first)
    const allSubmissions = await getAllSubmissions();

    // Transform submissions to match the expected format
    const formattedSubmissions = allSubmissions.map((submission) => {
      // Calculate score spread (range between highest and lowest scores)
      const totals = submission.totals;
      const scores = Object.values(totals);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const scoreSpread = maxScore - minScore;

      return {
        id: submission.id,
        createdAt: submission.createdAt,
        name: submission.name,
        team: submission.team,
        primaryRole: submission.primaryRole,
        secondaryRole: submission.secondaryRole,
        totals: submission.totals,
        rankedRoles: submission.rankedRoles,
        scoreSpread,
        // Include new fields for admin view
        skillProfile: submission.skillProfile,
        evidenceHighlights: submission.evidenceHighlights,
        primaryRecommendations: submission.primaryRecommendations,
        secondaryRecommendations: submission.secondaryRecommendations,
        summaryText: submission.summaryText,
        dominanceScore: submission.dominanceScore,
        confidenceBand: submission.confidenceBand,
        bonusQuestionsShown: submission.bonusQuestionsShown,
      };
    });

    return NextResponse.json(
      {
        submissions: formattedSubmissions,
        total: formattedSubmissions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving submissions:", error);
    return NextResponse.json(
      { error: "Failed to retrieve submissions" },
      { status: 500 }
    );
  }
}
