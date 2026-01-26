import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

/**
 * Session data interface for admin authentication
 * 
 * Uses iron-session for secure, signed cookies
 * Session expires after 24 hours
 */
export interface SessionData {
  adminSession?: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "change-this-to-a-random-secret-at-least-32-characters-long",
  cookieName: "admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    sameSite: "lax" as const,
    path: "/", // Ensure cookie is available for all paths
  },
};

/**
 * Get the current session
 * 
 * Returns a session object with save() and destroy() methods
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Check if user is authenticated as admin
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.adminSession === true;
}
