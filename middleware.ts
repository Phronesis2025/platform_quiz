import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession, unsealData } from "iron-session";

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
      // Get the cookie value
      const cookieValue = request.cookies.get("admin_session");
      
      // Debug logging
      console.log("Middleware check:", {
        path: request.nextUrl.pathname,
        hasCookie: !!cookieValue,
        cookieValue: cookieValue?.value?.substring(0, 20) + "...",
      });

      let adminSession = false;
      
      if (cookieValue?.value) {
        // Try to decrypt the cookie using unsealData (for cookies created with sealData)
        try {
          const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-to-a-random-secret-at-least-32-characters-long";
          const unsealed = await unsealData<SessionData>(cookieValue.value, {
            password: SESSION_SECRET,
          });
          adminSession = unsealed?.adminSession === true;
          console.log("Cookie unsealed successfully, adminSession:", adminSession, "unsealed data:", unsealed);
        } catch (unsealError) {
          // If unsealData fails, log the error and try getIronSession as fallback
          console.error("unsealData failed:", unsealError instanceof Error ? unsealError.message : String(unsealError));
          console.log("Cookie value length:", cookieValue.value.length);
          console.log("SESSION_SECRET is set:", !!process.env.SESSION_SECRET);
          
          // Try getIronSession as fallback
          try {
            const cookieStore = new MiddlewareCookieStore(request.cookies);
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
                  path: "/",
                },
              }
            );
            adminSession = session.adminSession === true;
            console.log("getIronSession result, adminSession:", adminSession);
          } catch (ironError) {
            console.error("getIronSession also failed:", ironError instanceof Error ? ironError.message : String(ironError));
          }
        }
      }

      // Check if admin is authenticated
      if (!adminSession) {
        console.log("Not authenticated, redirecting to login");
        // Redirect to login page
        const loginUrl = new URL("/admin/login", request.url);
        // Preserve the original URL as a query parameter for redirect after login
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      console.log("Authenticated, allowing access");
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
