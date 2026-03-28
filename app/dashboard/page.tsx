"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const AGENTS = [
  { name: "Travel", slug: "travel", icon: "✈️", desc: "Destinations, trips & adventure spots", color: "from-sky-500 to-cyan-400", borderHover: "hover:border-sky-500/50", glow: "group-hover:shadow-sky-500/10" },
  { name: "Food", slug: "food", icon: "🍜", desc: "Recipes, restaurants & street food finds", color: "from-orange-500 to-amber-400", borderHover: "hover:border-orange-500/50", glow: "group-hover:shadow-orange-500/10" },
  { name: "Knowledge Base", slug: "ideas", icon: "💡", desc: "Ideas, tech tips & startup concepts", color: "from-violet-500 to-purple-400", borderHover: "hover:border-violet-500/50", glow: "group-hover:shadow-violet-500/10" },
  { name: "Movies", slug: "movies", icon: "🎬", desc: "Watchlists, reviews & recommendations", color: "from-rose-500 to-pink-400", borderHover: "hover:border-rose-500/50", glow: "group-hover:shadow-rose-500/10" },
  { name: "Stocks", slug: "stocks", icon: "📈", desc: "Finance, crypto & market insights", color: "from-emerald-500 to-green-400", borderHover: "hover:border-emerald-500/50", glow: "group-hover:shadow-emerald-500/10" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

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
        const agent = AGENTS.find(a => a.name === data.data.category || a.slug === data.data.category.toLowerCase());
        const savedMsg = data.saved
          ? `💾 Saved to ${data.table}`
          : `⚠️ DB: ${data.dbError || "Not saved"}`;
        const extraMsg = data.extraInfo || "";
        setResult({
          type: "success",
          text: `${agent?.icon || "📌"} ${data.data.category}\n📝 ${data.data.summary}\n${savedMsg}${extraMsg}`,
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back 👋</h1>
        <p className="text-muted-foreground">Paste anything below — AI will organize it for you.</p>
      </motion.div>

      {/* Omni-Bar with Glow Effect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative"
      >
        {/* Glow background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-60 animate-pulse-glow" />
        <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-pink-500/40 animate-border-glow">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card">
            {/* AI sparkle icon */}
            <motion.div
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{ duration: 1.5, repeat: loading ? Infinity : 0, ease: "linear" }}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25"
            >
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </motion.div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a URL, recipe idea, movie name, travel spot, stock tip..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-base"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAnalyze}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300
                ${loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Analyzing...
                </span>
              ) : "Analyze"}
            </motion.button>
          </div>
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className={`mt-4 p-4 rounded-xl text-sm whitespace-pre-line border backdrop-blur-sm ${
                result.type === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                : result.type === "info" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
              }`}
            >
              {result.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Agent Grid */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold tracking-tight mb-5"
        >
          Your Agents
        </motion.h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {AGENTS.map((agent) => (
            <motion.div key={agent.slug} variants={cardVariants}>
              <Link
                href={`/dashboard/${agent.slug}`}
                className={`group relative block p-6 rounded-2xl border border-border/50 bg-card
                            ${agent.borderHover} hover:bg-accent/50
                            transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${agent.glow}`}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-lg mb-4`}
                  >
                    {agent.icon}
                  </motion.div>
                  <h3 className="text-lg font-bold mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.desc}</p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
