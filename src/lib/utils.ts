import { createHash } from "crypto";

/**
 * Hash an IP address for privacy
 * Uses SHA-256 to create a one-way hash
 * 
 * @param ip - IP address to hash
 * @returns SHA-256 hash of the IP address, or null if IP is not provided
 */
export function hashIP(ip: string | null | undefined): string | null {
  if (!ip) return null;
  
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, "");
  
  // Create SHA-256 hash
  return createHash("sha256").update(cleanIP).digest("hex");
}

/**
 * Extract IP address from request headers
 * Handles various proxy headers that might contain the real IP
 * 
 * @param request - Next.js request object
 * @returns IP address or null
 */
export function getIPAddress(request: Request): string | null {
  // Check various headers that might contain the IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return null;
}
