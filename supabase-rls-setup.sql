-- ============================================================
-- OmniMind | Row Level Security (RLS) Setup
-- ============================================================
-- CRITICAL: Run this BEFORE going live. Without RLS, any
-- authenticated user can read/modify any other user's data.
--
-- This script:
--   1. Enables RLS on all 5 agent tables
--   2. Creates policies for SELECT, INSERT, DELETE scoped to auth.uid()
--
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE patterns)
-- ============================================================


-- ============================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE travel_spots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_ideas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_tracker  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 2: DROP EXISTING POLICIES (safe re-run)
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own travel spots"   ON travel_spots;
DROP POLICY IF EXISTS "Users can insert their own travel spots" ON travel_spots;
DROP POLICY IF EXISTS "Users can delete their own travel spots" ON travel_spots;

DROP POLICY IF EXISTS "Users can view their own recipes"   ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

DROP POLICY IF EXISTS "Users can view their own ideas"   ON startup_ideas;
DROP POLICY IF EXISTS "Users can insert their own ideas" ON startup_ideas;
DROP POLICY IF EXISTS "Users can delete their own ideas" ON startup_ideas;

DROP POLICY IF EXISTS "Users can view their own movies"   ON movie_watchlist;
DROP POLICY IF EXISTS "Users can insert their own movies" ON movie_watchlist;
DROP POLICY IF EXISTS "Users can delete their own movies" ON movie_watchlist;

DROP POLICY IF EXISTS "Users can view their own stocks"   ON stock_tracker;
DROP POLICY IF EXISTS "Users can insert their own stocks" ON stock_tracker;
DROP POLICY IF EXISTS "Users can delete their own stocks" ON stock_tracker;


-- ============================================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================================
-- Each table gets 3 policies:
--   SELECT  -> USING (auth.uid() = user_id)
--   INSERT  -> WITH CHECK (auth.uid() = user_id)
--   DELETE  -> USING (auth.uid() = user_id)
-- ============================================================

-- ─── Travel Spots ───────────────────────────────────────────

CREATE POLICY "Users can view their own travel spots"
  ON travel_spots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel spots"
  ON travel_spots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel spots"
  ON travel_spots FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Recipes ────────────────────────────────────────────────

CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Startup Ideas ──────────────────────────────────────────

CREATE POLICY "Users can view their own ideas"
  ON startup_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas"
  ON startup_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
  ON startup_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Movie Watchlist ────────────────────────────────────────

CREATE POLICY "Users can view their own movies"
  ON movie_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies"
  ON movie_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies"
  ON movie_watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Stock Tracker ──────────────────────────────────────────

CREATE POLICY "Users can view their own stocks"
  ON stock_tracker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stocks"
  ON stock_tracker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stocks"
  ON stock_tracker FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- VERIFICATION: Check that RLS is enabled
-- ============================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'travel_spots',
    'recipes',
    'startup_ideas',
    'movie_watchlist',
    'stock_tracker'
  );

-- Expected output: All 5 tables should show rowsecurity = true
