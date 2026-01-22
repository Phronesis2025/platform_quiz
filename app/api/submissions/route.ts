import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { submissions } from "@/src/lib/schema";
import { desc } from "drizzle-orm";

/**
 * GET endpoint to retrieve all submissions
 * 
 * Returns all quiz submissions sorted by creation date (newest first)
 * Used by the admin page to display all submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Query all submissions from database, sorted by creation date (newest first)
    const allSubmissions = await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.createdAt));

    // Transform submissions to match the expected format
    const formattedSubmissions = allSubmissions.map((submission) => {
      // Calculate score spread (range between highest and lowest scores)
      const totals = submission.totals as Record<string, number>;
      const scores = Object.values(totals);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const scoreSpread = maxScore - minScore;

      return {
        id: submission.id,
        createdAt: submission.createdAt.toISOString(),
        name: submission.name,
        team: submission.team,
        primaryRole: submission.primaryRole,
        secondaryRole: submission.secondaryRole,
        totals: submission.totals,
        rankedRoles: submission.rankedRoles,
        scoreSpread,
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
