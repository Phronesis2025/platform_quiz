import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login
 * 
 * Authenticates admin with password and sets session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Validate password
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set admin session
    const session = await getSession();
    session.adminSession = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin login:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
