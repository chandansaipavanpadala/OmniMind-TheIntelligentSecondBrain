import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the absolute base URL for the current environment (with trailing slash).
 * Uses the Supabase-recommended pattern so OAuth redirects always resolve
 * to the correct domain — whether that is localhost, a Vercel preview, or
 * a custom production domain.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL  — set this in Vercel for your production domain
 * 2. NEXT_PUBLIC_VERCEL_URL — auto-injected by Vercel on every deployment
 * 3. Fallback to http://localhost:3000/ for local development
 */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/";
  // Ensure https:// when not localhost
  url = url.startsWith("http") ? url : `https://${url}`;
  // Ensure trailing slash
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
