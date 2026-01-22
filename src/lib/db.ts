import { kv } from "@vercel/kv";
import type { Submission, NewSubmission } from "./schema";
import { randomUUID } from "crypto";

/**
 * Database operations using Vercel KV (Redis)
 * 
 * This uses the @vercel/kv package which automatically reads from
 * environment variables:
 * - KV_REST_API_URL (required)
 * - KV_REST_API_TOKEN (required)
 * 
 * For local development, set these in .env.local
 * For Vercel deployment, set them in the Vercel dashboard
 * 
 * Redis Key Patterns:
 * - "submission:{id}" - Stores individual submission as JSON
 * - "submissions:index" - Sorted set for ordering by timestamp
 */

/**
 * Generate a new UUID for submission ID
 */
function generateId(): string {
  return randomUUID();
}

/**
 * Get a submission by ID
 */
export async function getSubmission(id: string): Promise<Submission | null> {
  try {
    const key = `submission:${id}`;
    const data = await kv.get<string>(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as Submission;
  } catch (error) {
    console.error("Error getting submission:", error);
    throw new Error("Failed to retrieve submission");
  }
}

/**
 * Create a new submission
 * 
 * Stores the submission data and adds it to the index for ordering
 */
export async function createSubmission(data: NewSubmission): Promise<Submission> {
  try {
    const id = generateId();
    const createdAt = new Date().toISOString();
    
    const submission: Submission = {
      ...data,
      id,
      createdAt,
    };
    
    // Store submission data
    const submissionKey = `submission:${id}`;
    await kv.set(submissionKey, JSON.stringify(submission));
    
    // Add to index (sorted set) for ordering by creation date
    // Use timestamp as score for sorting (newest first = higher timestamp)
    const timestamp = new Date(createdAt).getTime();
    await kv.zadd("submissions:index", { score: timestamp, member: id });
    
    return submission;
  } catch (error) {
    console.error("Error creating submission:", error);
    throw new Error("Failed to create submission");
  }
}

/**
 * Get all submissions, sorted by creation date (newest first)
 */
export async function getAllSubmissions(): Promise<Submission[]> {
  try {
    // Get all submission IDs from the sorted set (newest first)
    // ZREVRANGE returns highest to lowest scores
    const submissionIds = await kv.zrange<string[]>("submissions:index", 0, -1, {
      rev: true, // Reverse order (newest first)
    });
    
    if (submissionIds.length === 0) {
      return [];
    }
    
    // Fetch all submissions in parallel
    const submissionKeys = submissionIds.map((id) => `submission:${id}`);
    const submissions = await Promise.all(
      submissionKeys.map(async (key) => {
        const data = await kv.get<string>(key);
        if (!data) {
          return null;
        }
        return JSON.parse(data) as Submission;
      })
    );
    
    // Filter out any null values (shouldn't happen, but safety check)
    return submissions.filter((s): s is Submission => s !== null);
  } catch (error) {
    console.error("Error getting all submissions:", error);
    throw new Error("Failed to retrieve submissions");
  }
}

/**
 * Delete a submission (for admin/data management)
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  try {
    const submissionKey = `submission:${id}`;
    
    // Delete the submission data
    await kv.del(submissionKey);
    
    // Remove from index
    await kv.zrem("submissions:index", id);
    
    return true;
  } catch (error) {
    console.error("Error deleting submission:", error);
    throw new Error("Failed to delete submission");
  }
}

/**
 * Get total count of submissions
 */
export async function getSubmissionCount(): Promise<number> {
  try {
    const count = await kv.zcard("submissions:index");
    return count;
  } catch (error) {
    console.error("Error getting submission count:", error);
    return 0;
  }
}