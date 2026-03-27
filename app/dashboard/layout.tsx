import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { Suspense } from "react";

const AGENTS = [
  { name: "Travel", slug: "travel", icon: "✈️", color: "from-sky-500 to-cyan-400" },
  { name: "Food", slug: "food", icon: "🍜", color: "from-orange-500 to-amber-400" },
  { name: "Knowledge Base", slug: "ideas", icon: "💡", color: "from-violet-500 to-purple-400" },
  { name: "Movies", slug: "movies", icon: "🎬", color: "from-rose-500 to-pink-400" },
  { name: "Stocks", slug: "stocks", icon: "📈", color: "from-emerald-500 to-green-400" },
];

// ─── Async Server Component: Auth-dependent navbar content ───
async function UserSection() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const userEmail = (data.claims as any).email || "User";

  return (
    <>
      <span className="hidden sm:block text-sm text-muted-foreground">{userEmail}</span>
      <ThemeToggle />
      <LogoutButton />
    </>
  );
}

// ─── Loading placeholder for the user section ───
function UserSectionSkeleton() {
  return (
    <>
      <div className="hidden sm:block w-32 h-4 rounded bg-muted animate-pulse" />
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
      <div className="w-16 h-9 rounded bg-muted animate-pulse" />
    </>
  );
}

// ─── Main Dashboard Layout (static shell) ───
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              OmniMind
            </span>
          </Link>

          {/* Agent Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {AGENTS.map((agent) => (
              <Link
                key={agent.slug}
                href={`/dashboard/${agent.slug}`}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-lg
                           hover:text-foreground hover:bg-accent transition-all duration-200"
              >
                <span className="mr-1.5">{agent.icon}</span>
                {agent.name}
              </Link>
            ))}
          </nav>

          {/* User section: streams in after auth check */}
          <div className="flex items-center gap-3">
            <Suspense fallback={<UserSectionSkeleton />}>
              <UserSection />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Mobile Agent Nav */}
      <div className="md:hidden sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {AGENTS.map((agent) => (
            <Link
              key={agent.slug}
              href={`/dashboard/${agent.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-lg
                         hover:text-foreground hover:bg-accent transition-all duration-200 whitespace-nowrap"
            >
              <span>{agent.icon}</span>
              {agent.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
