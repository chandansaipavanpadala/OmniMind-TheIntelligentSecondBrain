-- ============================================================
-- OmniMind | Phase 5 Schema Migration
-- ============================================================
-- Adds new columns to all 5 agent tables for:
--   • Food: dish_name extraction, step-by-step JSONB, versioning
--   • Travel: city/state/country, deduplication via unique constraint
--   • Knowledge Base: tags for grouping
--   • Movies: genre, platform, ai_summary for accordion expand
--   • Stocks: sector, market_cap for smart grouping
--
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================


-- ============================================================
-- TABLE 1: recipes (Food Agent)
-- ============================================================
-- dish_name:  Already exists but was set to "Imported from Instagram".
--             Gemini will now extract the real dish name.
-- steps:      JSONB array of step-by-step instructions.
--             Example: [{"step":1,"text":"Boil water"},{"step":2,"text":"Add pasta"}]
-- version:    Integer for recipe versioning (same dish = bump version).
-- image_url:  Scraped thumbnail/image URL from metadata.

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT;


-- ============================================================
-- TABLE 2: travel_spots (Travel Agent)
-- ============================================================
-- place_name: The specific spot (e.g., "Eiffel Tower").
-- city:       City name (e.g., "Paris").
-- state:      State or province (nullable for international spots).
-- country:    Country name (e.g., "France").
-- image_url:  Scraped thumbnail/image URL.

ALTER TABLE travel_spots ADD COLUMN IF NOT EXISTS place_name TEXT;
ALTER TABLE travel_spots ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE travel_spots ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE travel_spots ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE travel_spots ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Unique constraint for deduplication: same user + same place + same city
-- This allows ON CONFLICT ... DO UPDATE for upsert behavior.
-- Using a unique index instead of constraint for IF NOT EXISTS support.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'uq_travel_user_place_city'
    ) THEN
        CREATE UNIQUE INDEX uq_travel_user_place_city
        ON travel_spots (user_id, LOWER(COALESCE(place_name, '')), LOWER(COALESCE(city, '')));
    END IF;
END $$;


-- ============================================================
-- TABLE 3: startup_ideas (Knowledge Base Agent)
-- ============================================================
-- tags: TEXT[] array for grouping (e.g., {"Startup", "Coding", "Life Hack"}).

ALTER TABLE startup_ideas ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';


-- ============================================================
-- TABLE 4: movie_watchlist (Movies Agent)
-- ============================================================
-- movie_name:  The actual movie/show title extracted by Gemini.
-- genre:       Genre string (e.g., "Action", "Comedy", "Sci-Fi").
-- platform_name: Streaming platform (e.g., "Netflix", "Hulu", "Prime Video").
-- ai_summary:  Longer AI-generated summary for accordion expansion.
-- image_url:   Poster/thumbnail URL.
-- Note: Existing 'title' held the AI summary and 'platform' held the URL.
--       New columns separate these concerns properly.

ALTER TABLE movie_watchlist ADD COLUMN IF NOT EXISTS movie_name TEXT;
ALTER TABLE movie_watchlist ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE movie_watchlist ADD COLUMN IF NOT EXISTS platform_name TEXT;
ALTER TABLE movie_watchlist ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE movie_watchlist ADD COLUMN IF NOT EXISTS image_url TEXT;


-- ============================================================
-- TABLE 5: stock_tracker (Stocks Agent)
-- ============================================================
-- stock_name:  Company/asset name (e.g., "Apple Inc.").
-- sector:      Market sector (e.g., "Tech", "Healthcare", "Energy").
-- market_cap:  Market cap tier (e.g., "Large Cap", "Mid Cap", "Small Cap").
-- image_url:   Company logo or chart screenshot URL.

ALTER TABLE stock_tracker ADD COLUMN IF NOT EXISTS stock_name TEXT;
ALTER TABLE stock_tracker ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE stock_tracker ADD COLUMN IF NOT EXISTS market_cap TEXT;
ALTER TABLE stock_tracker ADD COLUMN IF NOT EXISTS image_url TEXT;


-- ============================================================
-- RLS: Add UPDATE policies (needed for upsert/versioning)
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own travel spots" ON travel_spots;
CREATE POLICY "Users can update their own travel spots"
  ON travel_spots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ideas" ON startup_ideas;
CREATE POLICY "Users can update their own ideas"
  ON startup_ideas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own movies" ON movie_watchlist;
CREATE POLICY "Users can update their own movies"
  ON movie_watchlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stocks" ON stock_tracker;
CREATE POLICY "Users can update their own stocks"
  ON stock_tracker FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- VERIFICATION: Confirm new columns exist
-- ============================================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('recipes', 'travel_spots', 'startup_ideas', 'movie_watchlist', 'stock_tracker')
ORDER BY table_name, ordinal_position;
