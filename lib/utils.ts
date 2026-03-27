import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the absolute base URL for the current environment.
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL — set this for custom domains (e.g. https://omnimind.app)
 * 2. NEXT_PUBLIC_VERCEL_URL — auto-injected by Vercel on every deployment
 * 3. Fallback to http://localhost:3000 for local development
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: always use the current origin
    return window.location.origin;
  }

  // Server-side: resolve from environment variables
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
