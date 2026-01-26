import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/session";
import { cookies } from "next/headers";
import { sealData } from "iron-session";

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

    console.log("Login attempt received");
    console.log("ADMIN_PASSWORD is set:", !!process.env.ADMIN_PASSWORD);

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
      console.log("Password mismatch");
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    console.log("Password validated, setting session...");
    
    // Use the session helper to set the session properly
    // This ensures compatibility with middleware
    const session = await getSession();
    session.adminSession = true;
    await session.save();
    console.log("Session saved via getSession()");
    
    // Also manually seal and set the cookie as backup
    // This ensures the cookie is set correctly and can be decrypted by middleware
    const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-to-a-random-secret-at-least-32-characters-long";
    const sealed = await sealData({ adminSession: true }, {
      password: SESSION_SECRET,
    });
    
    console.log("Session sealed successfully, cookie length:", sealed.length);
    
    // Create response and set the cookie
    const response = NextResponse.json({ success: true });
    
    // Set the cookie with proper options matching middleware
    // Use the sealed value from sealData
    response.cookies.set("admin_session", sealed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    
    // Log cookie details for debugging
    console.log("Cookie set in response headers");
    console.log("Cookie value length:", sealed.length);
    console.log("Cookie value preview:", sealed.substring(0, 30) + "...");
    console.log("SESSION_SECRET length:", SESSION_SECRET.length);
    
    return response;
  } catch (error) {
    console.error("Error in admin login:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
