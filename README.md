<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<h1 align="center">OmniMind</h1>
<p align="center"><strong>The Intelligent Second Brain — Dump anything. AI organizes it.</strong></p>

---

## About

Modern life generates an overwhelming volume of information. You find a recipe while scrolling Instagram at midnight. A stock tip surfaces in a Telegram group. A friend texts you a travel recommendation. A startup idea strikes in the shower. By the time you sit down to organize it all, half of it is gone.

**OmniMind** solves this with a single-input paradigm called the **Omni-Bar**. Paste literally anything — an Instagram Reel URL, a YouTube video, a raw thought, a movie recommendation, or a stock ticker — and OmniMind's AI engine takes over. Powered by **Google Gemini 2.5 Flash**, the system performs real-time content analysis. It scrapes metadata from URLs using the **Microlink API** (bypassing Instagram's bot protection to extract actual captions and hashtags), feeds the enriched context to Gemini with category-specific rules, and receives back a structured classification and summary.

The classified data is then automatically routed into one of five specialized **Supabase PostgreSQL** tables — each mapped to an AI agent: Travel, Food, Knowledge Base, Movies, and Stocks. Every record is attached to the authenticated user's `user_id` via Supabase SSR Auth. Row Level Security ensures absolute data isolation between users.

Each agent has a dedicated dashboard view with full-text search, card-based masonry rendering, and smart URL detection. The Travel agent goes further by integrating the browser **Geolocation API**, allowing users to sort saved destinations by proximity to their current location using the Haversine distance formula.

The entire application is built on the **Next.js 16 App Router** with Turbopack, using Server Components for the auth-guarded layout and Client Components for interactive views. The glassmorphic, gradient-driven UI is powered by **Tailwind CSS 4** with a custom violet design system that supports seamless dark/light mode switching via `next-themes`.

OmniMind is not just a bookmarking tool. It is an AI-powered cognitive extension — a second brain that thinks, categorizes, and remembers so you don't have to.

---

## Features

### The Omni-Bar
A universal input that accepts any content — URLs, raw text, ideas, recommendations. OmniMind's AI engine analyzes the input and routes it to the correct agent automatically. No manual tagging, no folder selection, no cognitive overhead.

### 5 Specialized AI Agents

| Agent | Domain | Database Columns |
|-------|--------|-----------------|
| **Travel** | Destinations, trips, adventure | `insta_url`, `ai_tips`, `latitude`, `longitude` |
| **Food** | Recipes, restaurants, street food | `insta_url`, `instructions`, `dish_name` |
| **Knowledge Base** | Ideas, tech tips, startups | `title`, `description` |
| **Movies** | Films, series, anime, reviews | `title`, `platform` |
| **Stocks** | Finance, crypto, markets | `ticker`, `notes` |

### Metadata Scraping with Bot Bypass
Before sending content to Gemini, OmniMind extracts metadata (titles, captions, hashtags) via the Microlink API. This bypasses Instagram's bot protection to retrieve the actual reel caption — enabling accurate categorization based on real content, not just a URL string.

### Travel Agent: Geolocation Sorting
The Travel agent integrates the browser Geolocation API. Users can sort their saved destinations by distance from their current location using the Haversine formula.

### Full Authentication & Data Isolation
Supabase SSR Auth with email/password login, sign-up, and password recovery. Row Level Security (RLS) ensures each user can only read, write, update, and delete their own data.

### Dark/Light Mode
Powered by `next-themes` with a hand-crafted violet design system. Instant toggling with animated sun/moon icons and zero flash of unstyled content.

---

## Architecture

```
User Input (Omni-Bar)
       |
       v
  /api/analyze (Next.js Route Handler)
       |
       +-- 1. Microlink API --> Extract metadata (title, caption, hashtags)
       |
       +-- 2. Gemini 2.5 Flash --> Categorize + generate summary
       |
       +-- 3. Supabase Insert --> Route to correct table with user_id
              |
              +-- travel_spots
              +-- recipes
              +-- startup_ideas
              +-- movie_watchlist
              +-- stock_tracker
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Auth & Database** | Supabase (PostgreSQL + SSR Auth + RLS) |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Metadata Extraction** | Microlink API |
| **Theming** | next-themes |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Auth enabled
- A [Google AI Studio](https://aistudio.google.com) API key

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase (public — safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Supabase Admin (server-only — never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
```

> `SUPABASE_SERVICE_ROLE_KEY` intentionally lacks the `NEXT_PUBLIC_` prefix. It is only accessible in server-side Route Handlers and is never shipped to the browser.

### Installation

```bash
git clone https://github.com/your-username/omnimind.git
cd omnimind
npm install
npm run dev
```

### Database Setup

Run the following SQL in your Supabase SQL Editor to create the required tables and security policies:

```sql
-- Tables
CREATE TABLE travel_spots (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  insta_url TEXT,
  ai_tips TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  insta_url TEXT,
  dish_name TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE startup_ideas (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movie_watchlist (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_tracker (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ticker TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE travel_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_tracker ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all tables)
-- SELECT
CREATE POLICY "select_own" ON travel_spots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_own" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_own" ON startup_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_own" ON movie_watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "select_own" ON stock_tracker FOR SELECT USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "insert_own" ON travel_spots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_own" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_own" ON startup_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_own" ON movie_watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insert_own" ON stock_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "update_own" ON travel_spots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_own" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_own" ON startup_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_own" ON movie_watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "update_own" ON stock_tracker FOR UPDATE USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "delete_own" ON travel_spots FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON recipes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON startup_ideas FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON movie_watchlist FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON stock_tracker FOR DELETE USING (auth.uid() = user_id);
```

---

## Project Structure

```
omnimind/
+-- app/
|   +-- page.tsx                    # Landing page
|   +-- layout.tsx                  # Root layout + ThemeProvider
|   +-- api/analyze/route.ts        # AI Engine + Supabase Bridge
|   +-- auth/                       # Login, Sign-up, Password Recovery
|   +-- dashboard/
|       +-- layout.tsx              # Auth-guarded dashboard shell
|       +-- page.tsx                # Omni-Bar + Agent Grid
|       +-- travel/page.tsx         # Travel Agent view
|       +-- food/page.tsx           # Food Agent view
|       +-- ideas/page.tsx          # Knowledge Base view
|       +-- movies/page.tsx         # Movies Agent view
|       +-- stocks/page.tsx         # Stocks Agent view
+-- components/
|   +-- agent-view.tsx              # Reusable data grid with search
|   +-- navbar.tsx                  # Landing page navbar
|   +-- theme-provider.tsx          # next-themes wrapper
|   +-- theme-toggle.tsx            # Dark/Light toggle
+-- lib/supabase/
    +-- client.ts                   # Browser Supabase client
    +-- server.ts                   # Server Supabase client (SSR)
    +-- proxy.ts                    # Auth session refresh proxy
```

---

## License

MIT License. Built by an ECE student who believes AI should organize life, not complicate it.
