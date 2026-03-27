<h1 align="center">OmniMind | The Intelligent Second Brain</h1>

<p align="center">
  <strong>Dump any link, thought, or idea. Let 5 specialized AI agents organize your life automatically.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#setup">Setup</a> &bull;
  <a href="#deployment">Deployment</a> &bull;
  <a href="#database-schema">Database</a> &bull;
  <a href="#license">License</a>
</p>

---

## Overview

OmniMind is a full-stack SaaS application that acts as your **intelligent second brain**. Paste any URL, thought, recipe, movie recommendation, or stock tip into the universal Omni-Bar, and OmniMind's multi-agent AI system will automatically:

1. **Scrape metadata** from the submitted link using the Microlink API
2. **Classify** the content into one of five specialized domains using Google Gemini AI
3. **Summarize** the content with a concise, AI-generated description
4. **Store** the organized data in a secure, user-isolated Supabase database

No folders. No manual tagging. Just dump and go.

---

## Features

- **Universal Omni-Bar** -- A single input field that accepts any URL, thought, or freeform text. AI handles the rest.
- **5 Specialized AI Agents** -- Each agent manages a distinct life domain:
  - **Travel Agent** -- Destinations, trips, adventure spots, and travel tips
  - **Food Agent** -- Recipes, restaurants, street food finds, and cooking instructions
  - **Knowledge Base Agent** -- Startup ideas, tech tips, productivity hacks, and concepts
  - **Movies Agent** -- Watchlists, reviews, recommendations, and trailers
  - **Stocks Agent** -- Finance insights, crypto, market analysis, and investment notes
- **Intelligent Metadata Scraping** -- Extracts titles, descriptions, and context from submitted links via the Microlink API before AI analysis.
- **Gemini AI with Model Fallback** -- Uses `gemini-2.5-flash` as the primary model with automatic fallback to `gemini-flash-latest` for resilience.
- **Per-Agent Views** -- Dedicated pages for each agent with search, filtering, and card-based layouts.
- **Geolocation Sorting** -- Travel Agent supports sorting saved spots by proximity using the Haversine formula.
- **Secure Authentication** -- Full email/password auth flow via Supabase Auth (sign up, login, password reset, email confirmation).
- **Row Level Security (RLS)** -- Every database query is scoped to `auth.uid() = user_id`, ensuring strict data isolation between users.
- **Dark Mode / Light Mode** -- Seamless theme switching with `next-themes`.
- **Responsive Design** -- Fully responsive from mobile to desktop with a collapsible agent navigation bar.
- **Production-Ready Landing Page** -- A polished, animated landing page with gradient orbs, floating mockup, and agent showcase section.

---

## Tech Stack

| Layer          | Technology                                                                 |
|----------------|---------------------------------------------------------------------------|
| **Framework**  | [Next.js](https://nextjs.org/) (App Router, React Server Components)     |
| **Language**   | TypeScript                                                                |
| **AI Engine**  | [Google Gemini AI](https://ai.google.dev/) (`@google/generative-ai`)     |
| **Database**   | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)              |
| **Metadata**   | [Microlink API](https://microlink.io/) (link scraping and extraction)    |
| **Styling**    | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Hosting**    | [Vercel](https://vercel.com/)                                             |
| **Auth**       | Supabase Auth (SSR via `@supabase/ssr`)                                   |

---

## Architecture

```
User Input (Omni-Bar)
        |
        v
  /api/analyze (POST)
        |
        +---> 1. Auth Check (Supabase SSR cookie session)
        |
        +---> 2. Metadata Scraper (Microlink API)
        |
        +---> 3. Gemini AI Classification + Summarization
        |           |
        |           +---> Category: Travel | Food | Ideas | Movies | Stocks
        |           +---> Summary:  1-sentence AI description
        |
        +---> 4. Supabase DB Insert (service_role, scoped to user_id)
        |
        v
  JSON Response --> Frontend Result Banner
```

**Key Design Decisions:**

- The `/api/analyze` route uses `createServerClient` with cookies for **session-based auth verification**, ensuring only authenticated users can submit content.
- Database inserts use the **service_role key** to bypass RLS during writes (the API route validates the user first), while all client-side reads go through the **publishable key** and are protected by RLS policies.
- Each table has a unique column schema tailored to its domain (e.g., `insta_url` + `ai_tips` for Travel, `ticker` + `notes` for Stocks).

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Supabase](https://supabase.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini
- (Optional) A [Vercel](https://vercel.com/) account for deployment

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/omnimind.git
cd omnimind
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
# Found in: Supabase Dashboard > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Supabase Service Role Key (server-side only, never expose to client)
# Found in: Supabase Dashboard > Project Settings > API > service_role
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini AI
# Found in: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key
```

> **Important for Vercel Deployment:** When deploying to Vercel, add all four environment variables above to your Vercel project settings under **Settings > Environment Variables**. Vercel automatically provides `VERCEL_URL`, which OmniMind uses to resolve production URLs dynamically.

**Required Environment Variables Summary:**

| Variable                                | Where to Find                            | Scope        |
|-----------------------------------------|------------------------------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL`              | Supabase Dashboard > Settings > API      | Client + Server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | Supabase Dashboard > Settings > API      | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY`             | Supabase Dashboard > Settings > API      | Server only  |
| `GEMINI_API_KEY`                        | Google AI Studio > API Keys              | Server only  |

### 4. Set Up the Database

Run the following SQL in your Supabase SQL Editor to create the required tables and enable Row Level Security:

```sql
-- Travel Spots
CREATE TABLE IF NOT EXISTS travel_spots (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insta_url TEXT,
  ai_tips TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insta_url TEXT,
  dish_name TEXT,
  instructions TEXT
);

-- Startup Ideas
CREATE TABLE IF NOT EXISTS startup_ideas (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT
);

-- Movie Watchlist
CREATE TABLE IF NOT EXISTS movie_watchlist (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  platform TEXT
);

-- Stock Tracker
CREATE TABLE IF NOT EXISTS stock_tracker (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT,
  notes TEXT
);
```

Then enable RLS (see [Database Security](#database-security) below).

### 5. Configure Supabase Auth Redirects

In your Supabase Dashboard, navigate to **Authentication > URL Configuration** and add the following to your **Redirect URLs**:

- `http://localhost:3000/**` (for local development)
- `https://your-vercel-domain.vercel.app/**` (for production)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see OmniMind in action.

---

## Deployment

### Deploy to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add the following environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Deploy. Vercel automatically sets `VERCEL_URL`, which OmniMind uses to build dynamic redirect URLs.

> **Custom Domain:** If you configure a custom domain, also set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` in Vercel environment variables. This takes highest priority for URL resolution.

---

## Database Security

### Row Level Security (RLS)

This is the **most critical step** for a live, multi-user deployment. Without RLS, any authenticated user could read or modify another user's data.

Run the following SQL in your Supabase SQL Editor:

```sql
-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE travel_spots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_ideas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_tracker  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: Users can only SELECT, INSERT, DELETE their own rows
-- ============================================================

-- Travel Spots
CREATE POLICY "Users can view their own travel spots"
  ON travel_spots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel spots"
  ON travel_spots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel spots"
  ON travel_spots FOR DELETE
  USING (auth.uid() = user_id);

-- Recipes
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Startup Ideas
CREATE POLICY "Users can view their own ideas"
  ON startup_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas"
  ON startup_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
  ON startup_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Movie Watchlist
CREATE POLICY "Users can view their own movies"
  ON movie_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies"
  ON movie_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies"
  ON movie_watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Stock Tracker
CREATE POLICY "Users can view their own stocks"
  ON stock_tracker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stocks"
  ON stock_tracker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stocks"
  ON stock_tracker FOR DELETE
  USING (auth.uid() = user_id);
```

> **Note:** The `/api/analyze` route uses the `service_role` key to insert data, which bypasses RLS. This is intentional -- the route authenticates the user via session cookies first, then inserts with the validated `user_id`. Client-side reads from `AgentView` use the publishable key, which is fully subject to RLS policies.

---

## Project Structure

```
omnimind/
├── app/
│   ├── api/analyze/        # AI classification + DB insert API route
│   ├── auth/               # Auth pages (login, sign-up, confirm, reset)
│   ├── dashboard/          # Main dashboard + per-agent sub-pages
│   │   ├── travel/
│   │   ├── food/
│   │   ├── ideas/
│   │   ├── movies/
│   │   └── stocks/
│   ├── protected/          # Post-auth redirect page
│   ├── layout.tsx          # Root layout with theme provider
│   └── page.tsx            # Landing page
├── components/
│   ├── agent-view.tsx      # Reusable agent data viewer (search, cards, delete)
│   ├── login-form.tsx      # Login form component
│   ├── sign-up-form.tsx    # Sign-up form component
│   ├── forgot-password-form.tsx
│   ├── update-password-form.tsx
│   ├── navbar.tsx          # Landing page navbar
│   └── ui/                 # shadcn/ui primitives (Button, Card, Input, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   ├── server.ts       # Server Supabase client (cookies)
│   │   └── proxy.ts        # Supabase middleware proxy
│   └── utils.ts            # cn(), getBaseUrl(), hasEnvVars
├── public/                 # Static assets, OG images
├── .env.local              # Environment variables (not committed)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## License

This project is provided as-is for personal and educational use.

---

<p align="center">
  <sub>Built with Next.js, Supabase, and Google Gemini AI</sub>
</p>
