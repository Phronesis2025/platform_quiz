import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/src/lib/db";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/clear-data
 * 
 * Deletes all quiz submissions from Redis
 * This is a destructive operation - use with caution!
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get all submission IDs from the index
    const client = await getRedisClient();
    
    // Get all submission IDs from the sorted set
    const submissionIds = await client.zRange("submissions:index", 0, -1);
    
    if (submissionIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No submissions to delete",
        deletedCount: 0 
      });
    }
    
    // Delete all submission keys
    const submissionKeys = submissionIds.map((id) => `submission:${id}`);
    if (submissionKeys.length > 0) {
      await client.del(submissionKeys);
    }
    
    // Delete the index
    await client.del("submissions:index");
    
    console.log(`Deleted ${submissionIds.length} submissions`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${submissionIds.length} submission(s)`,
      deletedCount: submissionIds.length 
    });
  } catch (error) {
    console.error("Error clearing all data:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "An error occurred while clearing data" },
      { status: 500 }
    );
  }
}
