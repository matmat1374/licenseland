import type { NextRequest } from "next/server";

/**
 * Returns the public base URL of the app, respecting reverse-proxy headers.
 * Uses the request object when available, falls back to env/headers.
 */
export function getBaseUrl(req?: NextRequest): string {
  // 1. explicit env override (production with a real domain)
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;

  // 2. from request headers (preferred — works behind gateway)
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    return `${proto}://${host}`;
  }

  // 3. fallback
  return "http://localhost:3000";
}

/** Build an absolute URL from a path, using the detected base URL. */
export function absoluteUrl(path: string, req?: NextRequest): string {
  const base = getBaseUrl(req);
  return new URL(path, base).toString();
}
