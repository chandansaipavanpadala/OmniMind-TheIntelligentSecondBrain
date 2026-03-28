"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { MoodPromptBar } from "@/components/mood-prompt-bar";

interface TravelSpot {
  id: number;
  place_name: string;
  city: string;
  state: string | null;
  country: string;
  ai_tips: string;
  insta_url: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function TravelAgentView() {
  const [data, setData] = useState<TravelSpot[]>([]);
  const [filtered, setFiltered] = useState<TravelSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodIds, setMoodIds] = useState<number[] | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: spots, error } = await supabase
        .from("travel_spots")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && spots) {
        setData(spots);
        setFiltered(spots);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (moodIds === null) {
      setFiltered(data);
    } else {
      setFiltered(data.filter((s) => moodIds.includes(s.id)));
    }
  }, [moodIds, data]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("travel_spots").delete().eq("id", id);
    if (!error) {
      setData((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Group by country → state
  const grouped = filtered.reduce((acc: Record<string, Record<string, TravelSpot[]>>, spot) => {
    const country = spot.country || "Unknown";
    const state = spot.state || "General";
    if (!acc[country]) acc[country] = {};
    if (!acc[country][state]) acc[country][state] = [];
    acc[country][state].push(spot);
    return acc;
  }, {});

  const countryOrder = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-sky-500/25">
          ✈️
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Travel Agent</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {filtered.length} spots across {countryOrder.length} {countryOrder.length === 1 ? "country" : "countries"}
          </p>
        </div>
      </motion.div>

      {/* Mood Prompt Bar */}
      <MoodPromptBar tableName="travel_spots" onFilterIds={setMoodIds} accentColor="sky" />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full"
          />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-4xl mb-4">✈️</p>
          <p className="text-muted-foreground">No travel spots saved yet. Use the Omni-Bar to add some!</p>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {countryOrder.map((country) => (
            <motion.div
              key={country}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Country Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 font-bold text-sm">
                  {country.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="text-lg font-bold tracking-tight">{country}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-sky-500/20 to-transparent" />
              </div>

              {Object.entries(grouped[country]).map(([state, spots]) => (
                <div key={state} className="mb-6">
                  {/* State sub-header (only if not "General") */}
                  {state !== "General" && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 ml-1">
                      📍 {state}
                    </p>
                  )}

                  {/* Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {spots.map((spot, idx) => (
                      <motion.div
                        key={spot.id}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => setExpandedId(expandedId === spot.id ? null : spot.id)}
                        className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-sky-500/30 cursor-pointer card-hover"
                      >
                        {/* Image */}
                        <div className="relative h-32 sm:h-40 bg-gradient-to-br from-sky-500/10 to-cyan-400/10 overflow-hidden">
                          {spot.image_url ? (
                            <img
                              src={spot.image_url}
                              alt={spot.place_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl opacity-20">🗺️</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Place name overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-bold text-base leading-tight drop-shadow-lg">
                              {spot.place_name || "Unknown Spot"}
                            </h3>
                            <p className="text-white/60 text-xs mt-0.5">
                              {[spot.city, spot.state].filter(Boolean).join(", ")}
                            </p>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(spot.id); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm text-white/70 hover:text-red-400"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Expandable details */}
                        <AnimatePresence>
                          {expandedId === spot.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-2 border-t border-border/30">
                                <div className="p-2.5 rounded-lg bg-sky-500/5 border border-sky-500/10">
                                  <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-0.5">AI Tips</p>
                                  <p className="text-sm text-foreground/80 leading-relaxed">{spot.ai_tips}</p>
                                </div>
                                {spot.insta_url && (
                                  <a
                                    href={spot.insta_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-500 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    View source
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Collapsed preview */}
                        {expandedId !== spot.id && (
                          <div className="px-3 py-2">
                            <p className="text-xs text-muted-foreground line-clamp-1">{spot.ai_tips}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
