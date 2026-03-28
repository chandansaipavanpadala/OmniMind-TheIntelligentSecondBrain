"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { MoodPromptBar } from "@/components/mood-prompt-bar";

interface Idea {
  id: number;
  title: string;
  description: string;
  tags: string[];
  created_at?: string;
}

const TAG_COLORS: Record<string, string> = {
  Startup: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Coding: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Life Hack": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Productivity: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Tech: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  Business: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  AI: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
  Health: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  Finance: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Design: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20",
  Marketing: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
};

const DEFAULT_TAG_COLOR = "bg-muted text-muted-foreground border-border/30";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function IdeasAgentView() {
  const [data, setData] = useState<Idea[]>([]);
  const [filtered, setFiltered] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodIds, setMoodIds] = useState<number[] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: ideas, error } = await supabase
        .from("startup_ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && ideas) {
        setData(ideas);
        setFiltered(ideas);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Apply mood + tag filters
  useEffect(() => {
    let result = data;
    if (moodIds !== null) {
      result = result.filter((i) => moodIds.includes(i.id));
    }
    if (activeTag) {
      result = result.filter((i) => i.tags?.includes(activeTag));
    }
    setFiltered(result);
  }, [moodIds, activeTag, data]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("startup_ideas").delete().eq("id", id);
    if (!error) {
      setData((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(data.flatMap((i) => i.tags || []))).sort();

  // Group filtered items by their first tag (or "Untagged")
  const grouped = filtered.reduce((acc: Record<string, Idea[]>, idea) => {
    const tag = idea.tags?.length > 0 ? idea.tags[0] : "Untagged";
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(idea);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-violet-500/25">
          💡
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{filtered.length} ideas • {allTags.length} tags</p>
        </div>
      </motion.div>

      {/* Mood Prompt Bar */}
      <MoodPromptBar tableName="startup_ideas" onFilterIds={setMoodIds} accentColor="violet" />

      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => setActiveTag(null)}
            className={`tag-pill border ${
              activeTag === null
                ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30"
                : "bg-muted/50 text-muted-foreground border-border/30 hover:border-border"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`tag-pill border ${
                activeTag === tag
                  ? TAG_COLORS[tag] || DEFAULT_TAG_COLOR
                  : "bg-muted/50 text-muted-foreground border-border/30 hover:border-border"
              }`}
            >
              {tag}
              <span className="opacity-50">
                ({data.filter((i) => i.tags?.includes(tag)).length})
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
          />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-4xl mb-4">💡</p>
          <p className="text-muted-foreground">
            {activeTag ? `No ideas tagged "${activeTag}".` : "No ideas saved yet. Use the Omni-Bar to add some!"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([tag, ideas]) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Tag group header */}
              {!activeTag && (
                <div className="flex items-center gap-3 mb-4">
                  <span className={`tag-pill border ${TAG_COLORS[tag] || DEFAULT_TAG_COLOR}`}>
                    {tag}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-violet-500/15 to-transparent" />
                  <span className="text-xs text-muted-foreground">{ideas.length}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {ideas.map((idea, idx) => (
                  <motion.div
                    key={idea.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: idx * 0.05 }}
                    className="group relative p-5 rounded-2xl bg-card border border-border/50 hover:border-violet-500/30 card-hover"
                  >
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-foreground mb-2 pr-8 leading-snug break-words">
                      {idea.title?.startsWith("http") ? (
                        <a href={idea.title} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500 transition-colors">
                          {idea.title.length > 40 ? idea.title.substring(0, 40) + "..." : idea.title}
                        </a>
                      ) : (
                        idea.title || "Untitled"
                      )}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                      {idea.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {(idea.tags || []).map((t) => (
                        <span
                          key={t}
                          className={`tag-pill border text-[10px] ${TAG_COLORS[t] || DEFAULT_TAG_COLOR}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Timestamp */}
                    {idea.created_at && (
                      <p className="text-[10px] text-muted-foreground/50 mt-3 pt-2 border-t border-border/30">
                        {new Date(idea.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
