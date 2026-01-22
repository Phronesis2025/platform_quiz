import { NextRequest, NextResponse } from "next/server";
import { scoreResponses, type QuizResponses } from "@/src/lib/quiz";
import { createSubmission, getSubmission } from "@/src/lib/db";
import { hashIP, getIPAddress } from "@/src/lib/utils";
import { submissionRequestSchema } from "@/src/lib/validation";
import { getRateLimiter } from "@/src/lib/rate-limit";

// Force dynamic rendering - this route should never be statically generated
export const dynamic = "force-dynamic";

/**
 * API route to submit quiz responses
 * 
 * This endpoint:
 * - Validates input strictly using Zod
 * - Rejects partial quizzes (all questions must be answered)
 * - Computes scores server-side ONLY (never trusts client scores)
 * - Stores raw answers + computed results
 * - Implements rate limiting
 * - Returns submission ID
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body once
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check access code if required
    const requiredCode = process.env.NEXT_PUBLIC_QUIZ_CODE;
    if (requiredCode) {
      // Check if access code is provided and valid
      const providedCode = (requestBody as { accessCode?: string })?.accessCode;
      if (!providedCode || providedCode !== requiredCode) {
        return NextResponse.json(
          { error: "Invalid or missing access code" },
          { status: 403 }
        );
      }
    }

    // Extract metadata for rate limiting
    const ipAddress = getIPAddress(request);
    const ipHash = hashIP(ipAddress) || "unknown";
    const userAgent = request.headers.get("user-agent") || null;

    // Check rate limit
    const rateLimit = await getRateLimiter(ipHash);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // Extract accessCode and validate submission data separately
    const { accessCode: _accessCode, ...submissionData } = requestBody as {
      accessCode?: string;
      [key: string]: unknown;
    };

    // Strict validation with Zod (exclude accessCode from validation)
    const validationResult = submissionRequestSchema.safeParse(submissionData);
    
    if (!validationResult.success) {
      // Return detailed validation errors
      const errors = validationResult.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { responses, name, team } = validationResult.data;

    // Convert responses to the format expected by scoreResponses
    // (Zod validates the structure, but we need to ensure types match)
    const quizResponses: QuizResponses = {};
    for (const [questionIdStr, response] of Object.entries(responses)) {
      const questionId = parseInt(questionIdStr, 10);
      quizResponses[questionId] = response;
    }

    // CRITICAL: Compute scores server-side ONLY
    // Never trust any scores from the client - always recalculate
    const scoringResult = scoreResponses(quizResponses);

    // Create submission in Redis
    // Store both raw answers AND computed results
    const submission = await createSubmission({
      name: name?.trim() || null,
      team: team?.trim() || null,
      // Store raw answers (never modified)
      answers: quizResponses,
      // Store computed totals (calculated server-side)
      totals: scoringResult.totals,
      // Store computed ranked roles (calculated server-side)
      rankedRoles: scoringResult.ranked,
      // Store computed primary role (calculated server-side)
      primaryRole:
        typeof scoringResult.primaryRole === "string"
          ? scoringResult.primaryRole
          : scoringResult.primaryRole,
      secondaryRole: scoringResult.secondaryRole || null,
      // Store computed narrative (generated server-side)
      summaryText: scoringResult.narrative,
      userAgent,
      ipHash,
    });

    // Return success response with submission ID
    // Return computed scores (never trust client-provided scores)
    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id,
        submission: {
          id: submission.id,
          name: submission.name,
          team: submission.team,
          responses: submission.answers, // Raw answers
          scoring: {
            // All scores computed server-side
            totals: submission.totals,
            ranked: submission.rankedRoles,
            primaryRole: submission.primaryRole,
            secondaryRole: submission.secondaryRole,
            tieDetected: scoringResult.tieDetected,
            narrative: submission.summaryText,
          },
          timestamp: submission.createdAt,
        },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Error submitting quiz:", error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check if it's a Redis connection error
    const isRedisError = error instanceof Error && (
      error.message.includes("Redis") ||
      error.message.includes("KV") ||
      error.message.includes("connection") ||
      error.message.includes("REDIS_URL")
    );
    
    // Return more detailed error in development or for Redis errors
    const errorMessage =
      process.env.NODE_ENV === "development" || isRedisError
        ? error instanceof Error
          ? `${error.name}: ${error.message}`
          : "Failed to process quiz submission"
        : "Failed to process quiz submission";

    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isRedisError && { hint: "Check that REDIS_URL is set in Vercel environment variables" })
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve a submission by ID
 * Useful for debugging and admin purposes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID format" },
        { status: 400 }
      );
    }

    // Get submission from Redis
    const submission = await getSubmission(id);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Return submission data
    // Note: Scores are from database (computed server-side at submission time)
    return NextResponse.json(
      {
        id: submission.id,
        name: submission.name,
        team: submission.team,
        responses: submission.answers, // Raw answers
        scoring: {
          totals: submission.totals, // Server-computed
          ranked: submission.rankedRoles, // Server-computed
          primaryRole: submission.primaryRole, // Server-computed
          secondaryRole: submission.secondaryRole, // Server-computed
          narrative: submission.summaryText, // Server-computed
        },
        timestamp: submission.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving submission:", error);
    return NextResponse.json(
      { error: "Failed to retrieve submission" },
      { status: 500 }
    );
  }
}
