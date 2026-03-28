"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AgentViewProps {
  agentName: string;
  tableName: string;
  icon: string;
  color: string;
  columns: { key: string; label: string }[];      // Which columns to display
  searchColumns: string[];                          // Which columns to search through
  enableGeolocation?: boolean;                      // Travel-specific
}

interface RowData {
  id: number;
  created_at?: string;
  [key: string]: any;
}

export function AgentView({
  agentName,
  tableName,
  icon,
  color,
  columns,
  searchColumns,
  enableGeolocation = false,
}: AgentViewProps) {
  const [data, setData] = useState<RowData[]>([]);
  const [filtered, setFiltered] = useState<RowData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  const supabase = createClient();

  // Fetch data from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Try ordering by created_at first; if the column doesn't exist
      // Supabase will return an error — fall back to unordered fetch.
      let result = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (result.error) {
        // Retry without ordering (created_at column may not exist yet)
        result = await supabase.from(tableName).select("*");
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        setData(result.data || []);
        setFiltered(result.data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [tableName]);

  // Filter data when search changes
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(data);
      return;
    }

    const query = search.toLowerCase();
    const results = data.filter((row) =>
      searchColumns.some((col) =>
        String(row[col] || "").toLowerCase().includes(query)
      )
    );
    setFiltered(results);
  }, [search, data, searchColumns]);

  // Geolocation handler for Travel
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortByDistance(true);
      },
      () => alert("Location access denied.")
    );
  };

  // Calculate distance (Haversine) for Travel sorting
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const displayData = sortByDistance && userLocation
    ? [...filtered].sort((a, b) => {
        const distA = a.latitude && a.longitude ? haversine(userLocation.lat, userLocation.lng, a.latitude, a.longitude) : Infinity;
        const distB = b.latitude && b.longitude ? haversine(userLocation.lat, userLocation.lng, b.latitude, b.longitude) : Infinity;
        return distA - distB;
      })
    : filtered;

  // Delete handler
  const handleDelete = async (id: number) => {
    const { error: delErr } = await supabase.from(tableName).delete().eq("id", id);
    if (!delErr) {
      setData((prev) => prev.filter((row) => row.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{agentName} Agent</h1>
            <p className="text-sm text-muted-foreground">{displayData.length} saved items</p>
          </div>
        </div>

        {enableGeolocation && (
          <button
            onClick={requestLocation}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200
                       ${sortByDistance
                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
          >
            📍 {sortByDistance ? "Sorted by Distance" : "Sort by Distance"}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search your ${agentName.toLowerCase()} items...`}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-sm">
          {error}
        </div>
      ) : displayData.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">{icon}</p>
          <p className="text-muted-foreground">{search ? "No matching items found." : "No items saved yet. Use the Omni-Bar to add some!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayData.map((row) => (
            <div
              key={row.id}
              className="group p-5 rounded-xl bg-card border border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg relative"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(row.id)}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Columns */}
              {columns.map((col) => {
                const value = row[col.key];
                const displayValue = value || "—";
                const isUrl = typeof value === "string" && value.startsWith("http");

                return (
                  <div key={col.key} className="mb-3 last:mb-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{col.label}</p>
                    {isUrl ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-500 hover:text-violet-400 hover:underline transition-colors truncate block"
                        title={value}
                      >
                        {value.length > 50 ? value.substring(0, 50) + "..." : value}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed">{displayValue}</p>
                    )}
                  </div>
                );
              })}

              {/* Timestamp */}
              {row.created_at && (
                <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  {new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
