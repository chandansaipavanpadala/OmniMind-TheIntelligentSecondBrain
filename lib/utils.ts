import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a clean absolute base URL for the current environment (with trailing slash).
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL  — set this in Vercel for your production domain
 * 2. NEXT_PUBLIC_VERCEL_URL — auto-injected by Vercel (hostname only, no protocol)
 * 3. Fallback to http://localhost:3000/ for local development
 */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/";

  // Trim whitespace
  url = url.trim();

  // Strip accidental double-protocol (e.g. "https://https://…")
  url = url.replace(/^(https?:\/\/)+/, "");

  // Now we have a bare hostname (+ optional path). Add the correct protocol.
  const isLocalhost = url.startsWith("localhost") || url.startsWith("127.0.0.1");
  url = isLocalhost ? `http://${url}` : `https://${url}`;

  // Ensure trailing slash
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
