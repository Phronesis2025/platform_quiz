import { createClient } from "redis";
import type { Submission, NewSubmission } from "./schema";
import { randomUUID } from "crypto";

/**
 * Database operations using Redis
 * 
 * This uses the standard redis package which supports REDIS_URL connection strings.
 * Vercel provides REDIS_URL when you create a KV database.
 * 
 * For local development, set REDIS_URL in .env.local
 * For Vercel deployment, Vercel automatically provides REDIS_URL
 * 
 * Redis Key Patterns:
 * - "submission:{id}" - Stores individual submission as JSON
 * - "submissions:index" - Sorted set for ordering by timestamp
 */

// Create Redis client - will be initialized on first use
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

/**
 * Get or create Redis client
 */
async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  // If already connecting, wait a bit and try again
  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }
  }

  // Create Redis client with connection string
  redisClient = createClient({
    url: redisUrl,
  });

  // Handle connection errors
  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  // Connect to Redis
  isConnecting = true;
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    throw err;
  } finally {
    isConnecting = false;
  }

  return redisClient;
}

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
    const client = await getRedisClient();
    const key = `submission:${id}`;
    const data = await client.get(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as Submission;
  } catch (error) {
    console.error("Error getting submission:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        redisUrl: process.env.REDIS_URL ? "Set" : "Not set",
      });
      throw error;
    }
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
    // Check if Redis connection is available
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not set");
    }
    
    const client = await getRedisClient();
    const id = generateId();
    const createdAt = new Date().toISOString();
    
    const submission: Submission = {
      ...data,
      id,
      createdAt,
    };
    
    // Store submission data
    const submissionKey = `submission:${id}`;
    await client.set(submissionKey, JSON.stringify(submission));
    
    // Add to index (sorted set) for ordering by creation date
    // Use timestamp as score for sorting (newest first = higher timestamp)
    const timestamp = new Date(createdAt).getTime();
    await client.zAdd("submissions:index", {
      score: timestamp,
      value: id,
    });
    
    return submission;
  } catch (error) {
    console.error("Error creating submission:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        redisUrl: process.env.REDIS_URL ? "Set" : "Not set",
      });
      throw error; // Re-throw with original error message
    }
    throw new Error("Failed to create submission");
  }
}

/**
 * Get all submissions, sorted by creation date (newest first)
 */
export async function getAllSubmissions(): Promise<Submission[]> {
  try {
    const client = await getRedisClient();
    
    // Get all submission IDs from the sorted set (newest first)
    // ZREVRANGE returns highest to lowest scores
    const submissionIds = await client.zRange("submissions:index", 0, -1, {
      REV: true, // Reverse order (newest first)
    });
    
    if (submissionIds.length === 0) {
      return [];
    }
    
    // Fetch all submissions in parallel
    const submissionKeys = submissionIds.map((id) => `submission:${id}`);
    const submissions = await Promise.all(
      submissionKeys.map(async (key) => {
        const data = await client.get(key);
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
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        redisUrl: process.env.REDIS_URL ? "Set" : "Not set",
      });
      throw error;
    }
    throw new Error("Failed to retrieve submissions");
  }
}

/**
 * Delete a submission (for admin/data management)
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const submissionKey = `submission:${id}`;
    
    // Delete the submission data
    await client.del(submissionKey);
    
    // Remove from index
    await client.zRem("submissions:index", id);
    
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
    const client = await getRedisClient();
    const count = await client.zCard("submissions:index");
    return count;
  } catch (error) {
    console.error("Error getting submission count:", error);
    return 0;
  }
}
