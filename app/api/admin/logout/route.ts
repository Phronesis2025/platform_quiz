import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/logout
 * 
 * Clears admin session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin logout:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
