"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { MoodPromptBar } from "@/components/mood-prompt-bar";

interface Stock {
  id: number;
  ticker: string;
  notes: string;
  stock_name: string | null;
  sector: string | null;
  market_cap: string | null;
  image_url?: string;
  created_at?: string;
}

const SECTOR_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Tech:       { bg: "bg-blue-500/10",    text: "text-blue-500",    border: "border-blue-500/20",    icon: "💻" },
  Healthcare: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", icon: "🏥" },
  Energy:     { bg: "bg-amber-500/10",   text: "text-amber-500",   border: "border-amber-500/20",   icon: "⚡" },
  Finance:    { bg: "bg-green-500/10",   text: "text-green-500",   border: "border-green-500/20",   icon: "🏦" },
  Crypto:     { bg: "bg-orange-500/10",  text: "text-orange-500",  border: "border-orange-500/20",  icon: "🪙" },
  Consumer:   { bg: "bg-pink-500/10",    text: "text-pink-500",    border: "border-pink-500/20",    icon: "🛒" },
  Industrial: { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/20",   icon: "🏭" },
  Real_Estate:{ bg: "bg-violet-500/10",  text: "text-violet-500",  border: "border-violet-500/20",  icon: "🏠" },
};

const DEFAULT_SECTOR = { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border/30", icon: "📊" };

const CAP_BADGES: Record<string, string> = {
  "Large Cap": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Mid Cap":   "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Small Cap": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function StocksAgentView() {
  const [data, setData] = useState<Stock[]>([]);
  const [filtered, setFiltered] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodIds, setMoodIds] = useState<number[] | null>(null);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: stocks, error } = await supabase
        .from("stock_tracker")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && stocks) {
        setData(stocks);
        setFiltered(stocks);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;
    if (moodIds !== null) {
      result = result.filter((s) => moodIds.includes(s.id));
    }
    if (activeSector) {
      result = result.filter((s) => s.sector === activeSector);
    }
    setFiltered(result);
  }, [moodIds, activeSector, data]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("stock_tracker").delete().eq("id", id);
    if (!error) {
      setData((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Unique sectors
  const allSectors = Array.from(new Set(data.map((s) => s.sector).filter(Boolean) as string[])).sort();

  // Group by sector
  const grouped = filtered.reduce((acc: Record<string, Stock[]>, stock) => {
    const sector = stock.sector || "Other";
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(stock);
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
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-emerald-500/25">
          📈
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Stocks Agent</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{filtered.length} positions • {allSectors.length} sectors</p>
        </div>
      </motion.div>

      {/* Mood Prompt Bar */}
      <MoodPromptBar tableName="stock_tracker" onFilterIds={setMoodIds} accentColor="emerald" />

      {/* Sector Filter Pills */}
      {allSectors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => setActiveSector(null)}
            className={`tag-pill border ${
              activeSector === null
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted/50 text-muted-foreground border-border/30 hover:border-border"
            }`}
          >
            All Sectors
          </button>
          {allSectors.map((sector) => {
            const s = SECTOR_COLORS[sector] || DEFAULT_SECTOR;
            return (
              <button
                key={sector}
                onClick={() => setActiveSector(activeSector === sector ? null : sector)}
                className={`tag-pill border ${
                  activeSector === sector
                    ? `${s.bg} ${s.text} ${s.border}`
                    : "bg-muted/50 text-muted-foreground border-border/30 hover:border-border"
                }`}
              >
                {s.icon} {sector}
                <span className="opacity-50">
                  ({data.filter((st) => st.sector === sector).length})
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
          />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-4xl mb-4">📈</p>
          <p className="text-muted-foreground">
            {activeSector ? `No ${activeSector} stocks found.` : "No stocks tracked yet. Use the Omni-Bar to add some!"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([sector, stocks]) => {
            const sectorStyle = SECTOR_COLORS[sector] || DEFAULT_SECTOR;

            return (
              <motion.div
                key={sector}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Sector header */}
                {!activeSector && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${sectorStyle.bg} flex items-center justify-center text-base`}>
                      {sectorStyle.icon}
                    </div>
                    <h2 className="text-base font-bold">{sector}</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/15 to-transparent" />
                    <span className="text-xs text-muted-foreground">{stocks.length}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {stocks.map((stock, idx) => (
                    <motion.div
                      key={stock.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: idx * 0.05 }}
                      className="group relative p-5 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/30 card-hover"
                    >
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(stock.id)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Top row: Icon + Name + Ticker */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${sectorStyle.bg} ${sectorStyle.border} border flex items-center justify-center`}>
                          {stock.image_url ? (
                            <img src={stock.image_url} alt="" className="w-6 h-6 rounded object-contain" />
                          ) : (
                            <span className={`text-sm font-bold ${sectorStyle.text}`}>
                              {(stock.ticker || stock.stock_name || "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {stock.stock_name || stock.ticker}
                          </h3>
                          {stock.ticker && stock.stock_name && !stock.ticker.startsWith("http") && (
                            <p className="text-xs text-muted-foreground font-mono">{stock.ticker}</p>
                          )}
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {stock.sector && (
                          <span className={`tag-pill border text-[10px] ${sectorStyle.bg} ${sectorStyle.text} ${sectorStyle.border}`}>
                            {stock.sector}
                          </span>
                        )}
                        {stock.market_cap && (
                          <span className={`tag-pill border text-[10px] ${CAP_BADGES[stock.market_cap] || "bg-muted text-muted-foreground border-border/30"}`}>
                            {stock.market_cap}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 break-words">
                        {stock.notes}
                      </p>

                      {/* Source URL */}
                      {stock.ticker?.startsWith("http") && (
                        <a
                          href={stock.ticker}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-emerald-500 transition-colors mt-2"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Source
                        </a>
                      )}

                      {/* Timestamp */}
                      {stock.created_at && (
                        <p className="text-[10px] text-muted-foreground/50 mt-3 pt-2 border-t border-border/30">
                          {new Date(stock.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
