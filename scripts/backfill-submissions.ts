/**
 * Backfill Script for Existing Submissions
 * 
 * This script recomputes skill profiles, evidence highlights, and recommendations
 * for existing submissions that were created before these fields were added.
 * 
 * Usage:
 *   npm run backfill
 * 
 * Or directly:
 *   npx tsx scripts/backfill-submissions.ts
 * 
 * Requirements:
 *   - REDIS_URL environment variable must be set
 *   - Run from project root directory
 */

import { createClient } from "redis";
import { scoreResponses, type RoleId } from "../src/lib/quiz";
import { getRolePlaybookByString, getRolePlaybook } from "../src/lib/rolePlaybooks";
import type { Submission } from "../src/lib/schema";

/**
 * Get Redis client
 */
async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  const client = createClient({
    url: redisUrl,
  });

  client.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  await client.connect();
  return client;
}

/**
 * Backfill a single submission
 */
async function backfillSubmission(
  client: ReturnType<typeof createClient>,
  submission: Submission
): Promise<boolean> {
  try {
    // Check if submission already has the new fields (all are optional, so check each)
    const hasSkillProfile = submission.skillProfile && 
      Array.isArray(submission.skillProfile.tags) &&
      typeof submission.skillProfile.tagFrequency === 'object';
    const hasEvidenceHighlights = Array.isArray(submission.evidenceHighlights) && 
      submission.evidenceHighlights.length > 0;
    const hasPrimaryRecommendations = Array.isArray(submission.primaryRecommendations) && 
      submission.primaryRecommendations.length > 0;
    const hasSecondaryRecommendations = Array.isArray(submission.secondaryRecommendations);

    if (hasSkillProfile && hasEvidenceHighlights && hasPrimaryRecommendations && hasSecondaryRecommendations) {
      console.log(`  ✓ Submission ${submission.id} already has all fields, skipping`);
      return false; // No update needed
    }

    // Convert answers to QuizResponses format
    const quizResponses: Record<number, number | number[]> = {};
    for (const [questionIdStr, response] of Object.entries(submission.answers)) {
      const questionId = parseInt(questionIdStr, 10);
      if (!isNaN(questionId)) {
        quizResponses[questionId] = response as number | number[];
      }
    }

    // Recompute scoring result
    const scoringResult = scoreResponses(quizResponses);

    // Get role playbooks for recommendations
    const primaryPlaybook = getRolePlaybookByString(submission.primaryRole);
    const secondaryPlaybook = submission.secondaryRole
      ? getRolePlaybook(submission.secondaryRole as RoleId)
      : null;

    // Build recommendations
    const primaryRecommendations = primaryPlaybook?.bestUsedFor || [];
    const secondaryRecommendations = secondaryPlaybook?.bestUsedFor || [];

    // Update submission with new fields (only add if missing)
    const updatedSubmission: Submission = {
      ...submission,
      skillProfile: hasSkillProfile ? submission.skillProfile : scoringResult.skillProfile,
      evidenceHighlights: hasEvidenceHighlights ? submission.evidenceHighlights : scoringResult.evidenceHighlights,
      primaryRecommendations: hasPrimaryRecommendations ? submission.primaryRecommendations : primaryRecommendations,
      secondaryRecommendations: hasSecondaryRecommendations ? submission.secondaryRecommendations : secondaryRecommendations,
    };

    // Save updated submission back to Redis
    const submissionKey = `submission:${submission.id}`;
    await client.set(submissionKey, JSON.stringify(updatedSubmission));

    console.log(`  ✓ Updated submission ${submission.id}`);
    return true; // Updated
  } catch (error) {
    console.error(`  ✗ Error backfilling submission ${submission.id}:`, error);
    return false;
  }
}

/**
 * Main backfill function
 */
async function main() {
  console.log("Starting backfill of existing submissions...\n");

  let client: ReturnType<typeof createClient> | null = null;

  try {
    // Connect to Redis
    console.log("Connecting to Redis...");
    client = await getRedisClient();
    console.log("✓ Connected to Redis\n");

    // Get all submission IDs from the sorted set
    const submissionIds = await client.zRange("submissions:index", 0, -1, {
      REV: true, // Newest first
    });

    console.log(`Found ${submissionIds.length} submissions to process\n`);

    if (submissionIds.length === 0) {
      console.log("No submissions found. Exiting.");
      return;
    }

    // Process each submission
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < submissionIds.length; i++) {
      const submissionId = submissionIds[i];
      console.log(`Processing ${i + 1}/${submissionIds.length}: ${submissionId}`);

      try {
        // Get submission data
        const submissionKey = `submission:${submissionId}`;
        const data = await client.get(submissionKey);

        if (!data) {
          console.log(`  ⚠ Submission ${submissionId} not found in Redis, skipping`);
          errorCount++;
          continue;
        }

        const submission = JSON.parse(data) as Submission;

        // Backfill the submission
        const wasUpdated = await backfillSubmission(client, submission);

        if (wasUpdated) {
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error processing submission ${submissionId}:`, error);
        errorCount++;
      }

      // Small delay to avoid overwhelming Redis
      if (i < submissionIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("Backfill Summary:");
    console.log(`  Total submissions: ${submissionIds.length}`);
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Skipped (already up-to-date): ${skippedCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Fatal error during backfill:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
      console.log("\n✓ Disconnected from Redis");
    }
  }
}

// Run the backfill
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✓ Backfill completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Backfill failed:", error);
      process.exit(1);
    });
}
