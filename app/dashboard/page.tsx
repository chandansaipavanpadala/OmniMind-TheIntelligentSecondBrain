"use client";

import { useState } from "react";
import Link from "next/link";

const AGENTS = [
  { name: "Travel", slug: "travel", icon: "✈️", desc: "Destinations, trips & adventure spots", color: "from-sky-500 to-cyan-400", borderHover: "hover:border-sky-500/50" },
  { name: "Food", slug: "food", icon: "🍜", desc: "Recipes, restaurants & street food finds", color: "from-orange-500 to-amber-400", borderHover: "hover:border-orange-500/50" },
  { name: "Knowledge Base", slug: "ideas", icon: "💡", desc: "Ideas, tech tips & startup concepts", color: "from-violet-500 to-purple-400", borderHover: "hover:border-violet-500/50" },
  { name: "Movies", slug: "movies", icon: "🎬", desc: "Watchlists, reviews & recommendations", color: "from-rose-500 to-pink-400", borderHover: "hover:border-rose-500/50" },
  { name: "Stocks", slug: "stocks", icon: "📈", desc: "Finance, crypto & market insights", color: "from-emerald-500 to-green-400", borderHover: "hover:border-emerald-500/50" },
];

export default function DashboardHome() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setResult({ type: "error", text: "Paste a link, thought, or anything you want to save!" });
      return;
    }

    setLoading(true);
    setResult({ type: "info", text: "Scraping metadata & analyzing with AI..." });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
      });

      const data = await res.json();

      if (data.success) {
        const savedMsg = data.saved
          ? `💾 Saved to ${data.table}`
          : `⚠️ DB: ${data.dbError || "Not saved"}`;
        setResult({
          type: "success",
          text: `${AGENTS.find(a => a.name === data.data.category || a.slug === data.data.category.toLowerCase())?.icon || "📌"} ${data.data.category}\n📝 ${data.data.summary}\n${savedMsg}`,
        });
        setInput("");
      } else {
        setResult({ type: "error", text: data.error || "Analysis failed." });
      }
    } catch (err: any) {
      setResult({ type: "error", text: err.message || "Connection error." });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back 👋</h1>
        <p className="text-muted-foreground">Paste anything below — AI will organize it for you.</p>
      </div>

      {/* Omni-Bar */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-60" />
        <div className="relative p-1 rounded-2xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-pink-500/30">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50">
            <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a URL, recipe idea, movie name, travel spot, stock tip..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300
                         ${loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 active:scale-95"
                }`}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className={`mt-4 p-4 rounded-xl text-sm whitespace-pre-line border ${
            result.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
            : result.type === "info" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
          }`}>
            {result.text}
          </div>
        )}
      </div>

      {/* Agent Grid */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-5">Your Agents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent) => (
            <Link
              key={agent.slug}
              href={`/dashboard/${agent.slug}`}
              className={`group relative p-6 rounded-2xl border border-border/50 bg-card
                          ${agent.borderHover} hover:bg-accent/50
                          transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {agent.icon}
                </div>
                <h3 className="text-lg font-bold mb-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.desc}</p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
