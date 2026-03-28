"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { MoodPromptBar } from "@/components/mood-prompt-bar";

interface Movie {
  id: number;
  title: string;
  movie_name: string | null;
  genre: string | null;
  platform: string;
  platform_name: string | null;
  ai_summary: string | null;
  image_url?: string;
  created_at?: string;
}

const GENRE_ICONS: Record<string, string> = {
  Action: "💥",
  Comedy: "😂",
  "Sci-Fi": "🚀",
  Drama: "🎭",
  Horror: "👻",
  Thriller: "🔪",
  Romance: "💕",
  Documentary: "📹",
  Anime: "🎌",
  Fantasy: "🧙",
  Mystery: "🔍",
  Animation: "🎨",
};

const PLATFORM_COLORS: Record<string, string> = {
  Netflix: "bg-red-500/15 text-red-500 border-red-500/20",
  "Prime Video": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Hulu: "bg-green-500/15 text-green-500 border-green-500/20",
  "Disney+": "bg-blue-600/15 text-blue-400 border-blue-600/20",
  "HBO Max": "bg-purple-500/15 text-purple-400 border-purple-500/20",
  YouTube: "bg-red-600/15 text-red-400 border-red-600/20",
};

const DEFAULT_PLATFORM_COLOR = "bg-muted text-muted-foreground border-border/30";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function MoviesAgentView() {
  const [data, setData] = useState<Movie[]>([]);
  const [filtered, setFiltered] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodIds, setMoodIds] = useState<number[] | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: movies, error } = await supabase
        .from("movie_watchlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && movies) {
        setData(movies);
        setFiltered(movies);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;
    if (moodIds !== null) {
      result = result.filter((m) => moodIds.includes(m.id));
    }
    if (activeGenre) {
      result = result.filter((m) => m.genre === activeGenre);
    }
    setFiltered(result);
  }, [moodIds, activeGenre, data]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("movie_watchlist").delete().eq("id", id);
    if (!error) {
      setData((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Unique genres
  const allGenres = Array.from(new Set(data.map((m) => m.genre).filter(Boolean) as string[])).sort();

  // Group by genre
  const grouped = filtered.reduce((acc: Record<string, Movie[]>, movie) => {
    const genre = movie.genre || "Uncategorized";
    if (!acc[genre]) acc[genre] = [];
    acc[genre].push(movie);
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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center text-2xl shadow-lg shadow-rose-500/25">
          🎬
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movies Agent</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} titles • {allGenres.length} genres</p>
        </div>
      </motion.div>

      {/* Mood Prompt Bar */}
      <MoodPromptBar tableName="movie_watchlist" onFilterIds={setMoodIds} accentColor="rose" />

      {/* Genre Filter Pills */}
      {allGenres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => setActiveGenre(null)}
            className={`tag-pill border ${
              activeGenre === null
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : "bg-muted/50 text-muted-foreground border-border/30 hover:border-border"
            }`}
          >
            All
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
              className={`tag-pill border ${
                activeGenre === genre
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : "bg-muted/50 text-muted-foreground border-border/30 hover:border-border"
              }`}
            >
              {GENRE_ICONS[genre] || "🎬"} {genre}
              <span className="opacity-50">
                ({data.filter((m) => m.genre === genre).length})
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
            className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full"
          />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-muted-foreground">
            {activeGenre ? `No ${activeGenre} movies found.` : "No movies saved yet. Use the Omni-Bar to add some!"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([genre, movies]) => (
            <motion.div
              key={genre}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Genre header */}
              {!activeGenre && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg">{GENRE_ICONS[genre] || "🎬"}</span>
                  <h2 className="text-base font-bold">{genre}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-rose-500/15 to-transparent" />
                  <span className="text-xs text-muted-foreground">{movies.length}</span>
                </div>
              )}

              <Accordion.Root type="single" collapsible className="space-y-3">
                {movies.map((movie, idx) => (
                  <Accordion.Item key={movie.id} value={String(movie.id)} asChild>
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: idx * 0.05 }}
                      className="group rounded-2xl bg-card border border-border/50 hover:border-rose-500/30 overflow-hidden card-hover"
                    >
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full flex items-center gap-4 p-4 text-left cursor-pointer">
                          {/* Poster */}
                          <div className="flex-shrink-0 w-14 h-20 rounded-lg bg-gradient-to-br from-rose-500/10 to-pink-400/10 overflow-hidden">
                            {movie.image_url ? (
                              <img
                                src={movie.image_url}
                                alt={movie.movie_name || movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xl opacity-30">🎬</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {movie.movie_name || movie.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {movie.title !== movie.movie_name ? movie.title : ""}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {movie.genre && (
                                <span className="tag-pill border bg-rose-500/10 text-rose-500 border-rose-500/15 text-[10px]">
                                  {movie.genre}
                                </span>
                              )}
                              {movie.platform_name && (
                                <span className={`tag-pill border text-[10px] ${PLATFORM_COLORS[movie.platform_name] || DEFAULT_PLATFORM_COLOR}`}>
                                  {movie.platform_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete + expand chevron */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(movie.id); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <svg
                              className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </Accordion.Trigger>
                      </Accordion.Header>

                      <Accordion.Content className="accordion-content overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/30">
                          {/* AI Summary */}
                          {movie.ai_summary && (
                            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 mt-3">
                              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">AI Summary</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">{movie.ai_summary}</p>
                            </div>
                          )}

                          {/* Source */}
                          {movie.platform && movie.platform.startsWith("http") && (
                            <a
                              href={movie.platform}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              View source
                            </a>
                          )}

                          {movie.created_at && (
                            <p className="text-[10px] text-muted-foreground/50">
                              Added {new Date(movie.created_at).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </Accordion.Content>
                    </motion.div>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
