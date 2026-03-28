import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

/**
 * OAuth Callback Route
 * Supabase redirects here after the user authenticates with an OAuth provider
 * (e.g. Google). We exchange the temporary `code` for a full session, then
 * redirect the user to /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" allows passing a custom post-login destination
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful exchange — send the user to their dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to an error page
  return NextResponse.redirect(
    `${origin}/auth/error?error=Could not authenticate with provider`
  );
}
