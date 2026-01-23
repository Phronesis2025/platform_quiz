import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";

/**
 * Session data interface
 */
interface SessionData {
  adminSession?: boolean;
}

/**
 * Cookie store adapter for Next.js middleware
 * 
 * iron-session expects a specific cookie interface, so we create an adapter
 */
class MiddlewareCookieStore {
  private cookies: NextRequest["cookies"];

  constructor(cookies: NextRequest["cookies"]) {
    this.cookies = cookies;
  }

  get(name: string) {
    const cookie = this.cookies.get(name);
    return cookie?.value;
  }

  set(name: string, value: string, options?: any) {
    // In middleware, we can't set cookies directly
    // This is handled by the API routes
  }

  remove(name: string) {
    // In middleware, we can't remove cookies directly
    // This is handled by the API routes
  }
}

/**
 * Middleware to protect admin routes
 * 
 * Checks for admin session cookie and redirects to /admin/login if not authenticated
 */
export async function middleware(request: NextRequest) {
  // Only protect /admin routes (but allow /admin/login)
  if (request.nextUrl.pathname.startsWith("/admin") && 
      request.nextUrl.pathname !== "/admin/login") {
    
    try {
      // Create cookie store adapter
      const cookieStore = new MiddlewareCookieStore(request.cookies);
      
      // Get session from cookies
      const session = await getIronSession<SessionData>(
        cookieStore as any,
        {
          password: process.env.SESSION_SECRET || "change-this-to-a-random-secret-at-least-32-characters-long",
          cookieName: "admin_session",
          cookieOptions: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 24 hours
            sameSite: "lax" as const,
          },
        }
      );

      // Check if admin is authenticated
      if (!session.adminSession) {
        // Redirect to login page
        const loginUrl = new URL("/admin/login", request.url);
        // Preserve the original URL as a query parameter for redirect after login
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      // If session read fails, redirect to login
      console.error("Session read error:", error);
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
