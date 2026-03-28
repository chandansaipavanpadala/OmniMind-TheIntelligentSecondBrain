"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoodPromptBarProps {
  tableName: string;
  onFilterIds: (ids: number[] | null) => void; // null = show all
  accentColor: string; // e.g., "violet", "sky", "orange"
}

const ACCENT_MAP: Record<string, { from: string; to: string; ring: string; glow: string }> = {
  violet: { from: "from-violet-500", to: "to-fuchsia-500", ring: "ring-violet-500/30", glow: "rgba(139, 92, 246, 0.25)" },
  sky:    { from: "from-sky-500",    to: "to-cyan-400",    ring: "ring-sky-500/30",    glow: "rgba(14, 165, 233, 0.25)" },
  orange: { from: "from-orange-500", to: "to-amber-400",   ring: "ring-orange-500/30", glow: "rgba(249, 115, 22, 0.25)" },
  rose:   { from: "from-rose-500",   to: "to-pink-400",    ring: "ring-rose-500/30",   glow: "rgba(244, 63, 94, 0.25)" },
  emerald:{ from: "from-emerald-500",to: "to-green-400",   ring: "ring-emerald-500/30",glow: "rgba(16, 185, 129, 0.25)" },
};

export function MoodPromptBar({ tableName, onFilterIds, accentColor }: MoodPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.violet;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [prompt]);

  const handleSearch = async () => {
    if (!prompt.trim()) {
      onFilterIds(null);
      setActive(false);
      setMatchCount(null);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, table: tableName }),
      });

      const data = await res.json();

      if (data.success) {
        onFilterIds(data.matchedIds);
        setMatchCount(data.matched);
        setTotalCount(data.total);
        setActive(true);
      } else {
        console.error("Semantic search failed:", data.error);
      }
    } catch (err) {
      console.error("Semantic search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setPrompt("");
    onFilterIds(null);
    setActive(false);
    setMatchCount(null);
    setTotalCount(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="relative">
      {/* Outer glow ring */}
      <motion.div
        className="absolute -inset-[2px] rounded-2xl opacity-0"
        animate={{
          opacity: active ? 0.8 : prompt ? 0.4 : 0,
          boxShadow: `0 0 30px ${accent.glow}, 0 0 60px ${accent.glow}`,
        }}
        transition={{ duration: 0.6 }}
        style={{
          background: `linear-gradient(135deg, ${accent.glow}, transparent, ${accent.glow})`,
          borderRadius: "1rem",
        }}
      />

      {/* Animated gradient border */}
      <motion.div
        className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${accent.from} ${accent.to}`}
        animate={{ opacity: active ? 0.6 : prompt ? 0.3 : 0.1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Main container */}
      <div className="relative glass rounded-2xl p-4">
        <div className="flex items-start gap-3">
          {/* AI sparkle icon */}
          <motion.div
            className={`flex-shrink-0 mt-1 w-8 h-8 rounded-lg bg-gradient-to-br ${accent.from} ${accent.to} flex items-center justify-center shadow-lg`}
            animate={{ rotate: searching ? 360 : 0 }}
            transition={{ duration: 1, repeat: searching ? Infinity : 0, ease: "linear" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </motion.div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI agent... (e.g., &quot;I'm feeling adventurous&quot; or &quot;comfort food for rainy days&quot;)"
            rows={1}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-sm leading-relaxed resize-none min-h-[36px]"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AnimatePresence>
              {active && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:bg-accent/50 transition-all"
                >
                  Clear
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={searching || !prompt.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-300 shadow-lg
                ${searching || !prompt.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                  : `bg-gradient-to-r ${accent.from} ${accent.to} hover:shadow-xl`
                }`}
            >
              {searching ? (
                <span className="flex items-center gap-1.5">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Thinking...
                </span>
              ) : "Ask AI"}
            </motion.button>
          </div>
        </div>

        {/* Result indicator */}
        <AnimatePresence>
          {active && matchCount !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/30"
            >
              <p className="text-xs text-muted-foreground">
                <span className={`font-bold bg-gradient-to-r ${accent.from} ${accent.to} bg-clip-text text-transparent`}>
                  {matchCount}
                </span>
                {" "}of {totalCount} items matched your mood
                {matchCount === 0 && " — try a different prompt!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
