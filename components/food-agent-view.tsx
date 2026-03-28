"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { MoodPromptBar } from "@/components/mood-prompt-bar";

interface Recipe {
  id: number;
  dish_name: string;
  instructions: string;
  insta_url: string;
  steps: { step: number; text: string }[];
  version: number;
  image_url?: string;
  created_at?: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function FoodAgentView() {
  const [data, setData] = useState<Recipe[]>([]);
  const [filtered, setFiltered] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [versions, setVersions] = useState<Recipe[]>([]);
  const [activeVersion, setActiveVersion] = useState(0);
  const [moodIds, setMoodIds] = useState<number[] | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && recipes) {
        setData(recipes);
        setFiltered(recipes);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Apply mood filter
  useEffect(() => {
    if (moodIds === null) {
      setFiltered(data);
    } else {
      setFiltered(data.filter((r) => moodIds.includes(r.id)));
    }
  }, [moodIds, data]);

  // When a card is clicked, find all versions of the same dish
  const openRecipe = useCallback(
    (recipe: Recipe) => {
      const allVersions = data
        .filter((r) => r.dish_name.toLowerCase() === recipe.dish_name.toLowerCase())
        .sort((a, b) => b.version - a.version);
      setVersions(allVersions);
      setActiveVersion(0);
      setSelected(recipe);
    },
    [data]
  );

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (!error) {
      setData((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Deduplicate by dish_name: only show the latest version in the grid
  const uniqueDishes = filtered.reduce((acc: Recipe[], recipe) => {
    const existing = acc.find((r) => r.dish_name.toLowerCase() === recipe.dish_name.toLowerCase());
    if (!existing || recipe.version > existing.version) {
      return [...acc.filter((r) => r.dish_name.toLowerCase() !== recipe.dish_name.toLowerCase()), recipe];
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/25">
          🍜
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Food Agent</h1>
          <p className="text-sm text-muted-foreground">{uniqueDishes.length} dishes saved</p>
        </div>
      </motion.div>

      {/* Mood Prompt Bar */}
      <MoodPromptBar tableName="recipes" onFilterIds={setMoodIds} accentColor="orange" />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
          />
        </div>
      ) : uniqueDishes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-4xl mb-4">🍜</p>
          <p className="text-muted-foreground">No recipes saved yet. Use the Omni-Bar to add some!</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {uniqueDishes.map((recipe) => (
            <motion.div
              key={recipe.id}
              variants={cardVariants}
              layoutId={`food-card-${recipe.id}`}
              onClick={() => openRecipe(recipe)}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-orange-500/30 cursor-pointer card-hover"
            >
              {/* Image */}
              <div className="relative h-44 bg-gradient-to-br from-orange-500/10 to-amber-400/10 overflow-hidden">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.dish_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl opacity-30">🍳</span>
                  </div>
                )}

                {/* Version badge */}
                {(() => {
                  const versionCount = data.filter(
                    (r) => r.dish_name.toLowerCase() === recipe.dish_name.toLowerCase()
                  ).length;
                  return versionCount > 1 ? (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-orange-500/90 text-white text-[10px] font-bold backdrop-blur-sm">
                      {versionCount} versions
                    </div>
                  ) : null;
                })()}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Dish name on image */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                    {recipe.dish_name}
                  </h3>
                </div>
              </div>

              {/* Bottom section */}
              <div className="p-4">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {recipe.instructions}
                </p>
                {recipe.created_at && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {new Date(recipe.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                className="absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-red-500/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ===== Frosted Glass Recipe Modal ===== */}
      <Dialog.Root open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <AnimatePresence>
          {selected && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 dialog-overlay"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed z-50 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl glass-heavy p-0"
                >
                  {/* Modal header image */}
                  <div className="relative h-48 bg-gradient-to-br from-orange-500/20 to-amber-400/20 overflow-hidden rounded-t-3xl">
                    {versions[activeVersion]?.image_url ? (
                      <img
                        src={versions[activeVersion].image_url}
                        alt={versions[activeVersion].dish_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl opacity-20">🍳</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <Dialog.Title className="text-white text-2xl font-bold drop-shadow-lg">
                        {versions[activeVersion]?.dish_name || selected.dish_name}
                      </Dialog.Title>
                      <p className="text-white/70 text-sm mt-1">
                        Version {versions[activeVersion]?.version || 1}
                      </p>
                    </div>
                    <Dialog.Close asChild>
                      <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Version tabs */}
                  {versions.length > 1 && (
                    <div className="flex gap-2 px-5 pt-4 overflow-x-auto">
                      {versions.map((v, i) => (
                        <button
                          key={v.id}
                          onClick={() => setActiveVersion(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                            ${i === activeVersion
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                              : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50"
                            }`}
                        >
                          V{v.version}
                          {i === 0 && " (Latest)"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* AI Summary */}
                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">AI Summary</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {versions[activeVersion]?.instructions || selected.instructions}
                      </p>
                    </div>

                    {/* Steps */}
                    {(() => {
                      const steps = versions[activeVersion]?.steps || selected.steps || [];
                      return steps.length > 0 ? (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Step-by-Step
                          </p>
                          <div className="space-y-3">
                            {steps.map((s: { step: number; text: string }, idx: number) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="flex gap-3"
                              >
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {s.step || idx + 1}
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">
                                  {s.text}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Source URL */}
                    {(versions[activeVersion]?.insta_url || selected.insta_url) && (
                      <a
                        href={versions[activeVersion]?.insta_url || selected.insta_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-orange-500 transition-colors pt-2 border-t border-border/30"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        View original source
                      </a>
                    )}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}
