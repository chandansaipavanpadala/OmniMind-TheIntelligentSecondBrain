import Link from "next/link";
import { Navbar } from "@/components/navbar";

const AGENTS = [
  { name: "Travel", icon: "✈️", desc: "Destinations, trips & adventure spots", color: "from-sky-500 to-cyan-400" },
  { name: "Food", icon: "🍜", desc: "Recipes, restaurants & street food finds", color: "from-orange-500 to-amber-400" },
  { name: "Knowledge Base", icon: "💡", desc: "Ideas, tech tips & startup concepts", color: "from-violet-500 to-purple-400" },
  { name: "Movies", icon: "🎬", desc: "Watchlists, reviews & recommendations", color: "from-rose-500 to-pink-400" },
  { name: "Stocks", icon: "📈", desc: "Finance, crypto & market insights", color: "from-emerald-500 to-green-400" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* ===== Background Decorations ===== */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Large gradient orb - top right */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full
                        bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20
                        blur-3xl animate-pulse-glow" />
        {/* Medium orb - bottom left */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full
                        bg-gradient-to-br from-cyan-500/15 to-blue-500/15
                        blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
        {/* Small orb - center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full
                        bg-gradient-to-br from-violet-500/10 to-pink-500/10
                        blur-3xl animate-float" />
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
             style={{
               backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
               backgroundSize: "32px 32px"
             }} />
      </div>

      {/* ===== Hero Section ===== */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full
                          bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20
                          text-violet-600 dark:text-violet-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            The Intelligent Second Brain
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up-delayed text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="block">Dump anything.</span>
            <span className="block bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent animate-gradient-shift">
              AI organizes it.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up-delayed-2 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
            Paste any link, thought, recipe, or movie recommendation. OmniMind&apos;s five specialized agents
            instantly categorize, summarize, and store everything — so you never lose an idea again.
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-up-delayed-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="group relative px-8 py-3.5 text-base font-semibold rounded-full
                         bg-gradient-to-r from-violet-600 to-fuchsia-600
                         hover:from-violet-500 hover:to-fuchsia-500
                         text-white shadow-2xl shadow-violet-500/30
                         hover:shadow-violet-500/50
                         transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Get Started — It&apos;s Free</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            </Link>
            <a
              href="#agents"
              className="px-8 py-3.5 text-base font-semibold rounded-full
                         border border-border hover:border-violet-500/50
                         bg-white/5 dark:bg-white/5 backdrop-blur-sm
                         hover:bg-violet-500/10
                         transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Meet the Agents ↓
            </a>
          </div>

          {/* Floating Mockup Preview */}
          <div className="mt-20 animate-slide-up-delayed-3">
            <div className="relative max-w-3xl mx-auto">
              {/* Glow behind the card */}
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              
              <div className="relative rounded-2xl border border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
                {/* Fake browser dots */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">localhost:3000/dashboard</span>
                </div>
                
                {/* Fake Omni-Bar */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 dark:bg-white/5 border border-border mb-6">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-muted-foreground text-sm">Paste any link, idea, or thought here...</span>
                  <div className="ml-auto px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold">
                    Analyze
                  </div>
                </div>

                {/* Fake agent cards preview */}
                <div className="grid grid-cols-5 gap-3">
                  {AGENTS.map((agent) => (
                    <div key={agent.name} className="text-center p-3 rounded-xl bg-muted/30 dark:bg-white/5 border border-border/50">
                      <span className="text-2xl">{agent.icon}</span>
                      <p className="text-[11px] font-medium mt-1.5 text-foreground/70">{agent.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===== Agent Showcase Section ===== */}
      <section id="agents" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              5 Agents. One Hub.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Each agent is a specialist trained to handle a specific domain of your life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map((agent, i) => (
              <div
                key={agent.name}
                className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm
                           hover:border-violet-500/30 hover:bg-accent/50
                           transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl
                                  shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {agent.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.desc}</p>
                </div>
              </div>
            ))}

            {/* "More coming" card */}
            <div className="group relative p-6 rounded-2xl border border-dashed border-border/50
                            hover:border-violet-500/30 transition-all duration-500 hover:-translate-y-1
                            flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-2xl mb-4
                              group-hover:border-violet-500/50 transition-colors duration-300">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1 text-muted-foreground">More Soon</h3>
              <p className="text-sm text-muted-foreground">Gym, Badminton & more</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Supabase & Gemini AI
          </p>
          <p className="text-sm text-muted-foreground">
            © 2026 OmniMind
          </p>
        </div>
      </footer>
    </div>
  );
}