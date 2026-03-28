import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// --- Core Initialization ---
const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey || "");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Future-proof: Add "Gym", "Badminton", etc. here
const AGENT_CATEGORIES = ['Travel', 'Food', 'Ideas', 'Movies', 'Stocks'];

// Maps each agent category to its Supabase table name
const CATEGORY_TABLE_MAP: Record<string, string> = {
    Travel: "travel_spots",
    Food: "recipes",
    Ideas: "startup_ideas",
    Movies: "movie_watchlist",
    Stocks: "stock_tracker",
};

// ========================================================
// Task 1: The "Metadata Scraper" — Cures the AI's blindness
// ========================================================
async function scrapeMetadata(url: string): Promise<{ text: string; imageUrl: string }> {
    try {
        console.log("Scraper: Querying Microlink API for metadata...");

        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
        const res = await fetch(microlinkUrl);

        if (!res.ok) {
            console.warn(`Scraper: Microlink returned HTTP ${res.status}. Falling back to raw URL.`);
            return { text: "", imageUrl: "" };
        }

        const json = await res.json();

        if (json.status !== "success" || !json.data) {
            console.warn("Scraper: Microlink returned non-success status:", json.status);
            return { text: "", imageUrl: "" };
        }

        const title = json.data.title || "";
        const description = json.data.description || "";
        const combined = `${title} ${description}`.trim();
        const imageUrl = json.data.image?.url || json.data.logo?.url || "";

        if (combined) {
            console.log("Scraper: Microlink extracted metadata successfully.");
            console.log("  Title:", title);
            console.log("  Description:", description);
            if (imageUrl) console.log("  Image:", imageUrl);
        } else {
            console.warn("Scraper: Microlink returned empty metadata.");
        }

        return { text: combined, imageUrl };
    } catch (error: any) {
        console.warn("Scraper: Microlink fetch failed:", error.message);
        return { text: "", imageUrl: "" }; // Graceful fallback
    }
}

// ========================================================
// Phase 5 Gemini Prompt — Deep Field Extraction
// ========================================================
function buildPhase5Prompt(url: string, caption: string): string {
    const contextBlock = caption
        ? `The content's scraped title and caption is: "${caption}"`
        : `No caption could be extracted. Infer everything from the URL structure: ${url}`;

    return `
You are the extraction engine for OmniMind, a personal life-hub app.
A piece of content was submitted with this URL: ${url}
${contextBlock}

IMPORTANT: Pay close attention to hashtags (e.g. #travel, #food, #recipe, #movie, #stocks).
Hashtags are the strongest signal for categorization. If #travel or #kerala or #wanderlust appears, it is Travel.

STEP 1: Categorize this content strictly into one of: ${AGENT_CATEGORIES.join(', ')}.

Rules for categorization:
- Travel: Destinations, trips, flights, hotels, tourist spots, nature, adventure, wanderlust, explore.
- Food: Recipes, restaurants, cooking, street food, cafes, baking, foodie.
- Ideas: Startups, business, productivity, tech, innovation, side hustles, coding, life hacks.
- Movies: Films, trailers, reviews, TV shows, actors, cinema, anime, Netflix, series.
- Stocks: Finance, investing, trading, crypto, markets, economy, mutual funds.

STEP 2: Based on the category, extract SPECIFIC fields. Follow the exact JSON schema below.

If category is "Food", return:
{
  "category": "Food",
  "summary": "A short 1-sentence description",
  "dish_name": "The actual name of the dish (e.g., 'Butter Chicken', 'Pasta Carbonara'). If unclear, use the most descriptive name possible.",
  "steps": [
    {"step": 1, "text": "Step 1 instruction"},
    {"step": 2, "text": "Step 2 instruction"}
  ]
}
Extract the real dish_name, NOT "Imported from Instagram". If you can identify cooking steps, extract them. If the content is a restaurant review (not a recipe), use steps like: [{"step": 1, "text": "Visit recommendation and what to order"}].

If category is "Travel", return:
{
  "category": "Travel",
  "summary": "A short 1-sentence description",
  "place_name": "The specific place/landmark (e.g., 'Eiffel Tower', 'Munnar Hills')",
  "city": "The city name (e.g., 'Paris', 'Munnar')",
  "state": "The state/province (e.g., 'Île-de-France', 'Kerala'). Use null if not applicable.",
  "country": "The country (e.g., 'France', 'India')"
}

If category is "Ideas", return:
{
  "category": "Ideas",
  "summary": "A short 1-sentence description",
  "title": "A concise title for this knowledge item",
  "tags": ["Tag1", "Tag2"]
}
Tags should be from common categories like: "Startup", "Coding", "Life Hack", "Productivity", "Tech", "Business", "AI", "Health", "Finance", "Design", "Marketing". Pick 1-3 most relevant tags.

If category is "Movies", return:
{
  "category": "Movies",
  "summary": "A 1-sentence teaser",
  "movie_name": "The actual movie or show title",
  "genre": "Primary genre (e.g., 'Action', 'Comedy', 'Sci-Fi', 'Drama', 'Horror', 'Thriller', 'Romance', 'Documentary', 'Anime')",
  "platform_name": "Streaming platform if identifiable (e.g., 'Netflix', 'Prime Video', 'Hulu', 'Disney+', 'HBO Max'). Use null if unknown.",
  "ai_summary": "A detailed 2-3 sentence summary of the plot or review content"
}

If category is "Stocks", return:
{
  "category": "Stocks",
  "summary": "A short 1-sentence description",
  "stock_name": "Company or asset name (e.g., 'Apple Inc.', 'Bitcoin')",
  "ticker": "Stock ticker if known (e.g., 'AAPL', 'BTC'). Use null if unknown.",
  "sector": "Market sector (e.g., 'Tech', 'Healthcare', 'Energy', 'Finance', 'Crypto', 'Consumer', 'Industrial')",
  "market_cap": "Market cap tier if known: 'Large Cap', 'Mid Cap', 'Small Cap', or null"
}

Return ONLY the JSON object. No markdown fences, no explanation, no extra text.
`;
}

// ========================================================
// Phase 5 Insert Logic — Smart Upserts & Versioning
// ========================================================

/**
 * FOOD: Version-aware insert.
 * If dish_name already exists for this user, bump the version and append.
 */
async function insertFood(data: any, url: string, userId: string, imageUrl: string) {
    const dishName = data.dish_name || "Unknown Dish";
    const steps = data.steps || [];

    // Check if this dish already exists for this user
    const { data: existing } = await supabase
        .from("recipes")
        .select("id, version")
        .eq("user_id", userId)
        .ilike("dish_name", dishName)
        .order("version", { ascending: false })
        .limit(1);

    const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

    const payload: Record<string, any> = {
        insta_url: url,
        instructions: data.summary,
        dish_name: dishName,
        steps: steps,
        version: nextVersion,
        user_id: userId,
    };

    if (imageUrl) payload.image_url = imageUrl;

    const { error } = await supabase.from("recipes").insert(payload);

    return {
        error,
        isNewVersion: nextVersion > 1,
        version: nextVersion,
    };
}

/**
 * TRAVEL: Deduplication via upsert.
 * If the same place_name + city exists for this user, update instead of insert.
 */
async function insertTravel(data: any, url: string, userId: string, imageUrl: string) {
    const placeName = data.place_name || "Unknown Spot";
    const city = data.city || "";
    const state = data.state || null;
    const country = data.country || "";

    // Check for existing duplicate
    const { data: existing } = await supabase
        .from("travel_spots")
        .select("id")
        .eq("user_id", userId)
        .ilike("place_name", placeName)
        .ilike("city", city)
        .limit(1);

    if (existing && existing.length > 0) {
        // Duplicate found — update the existing row
        const updatePayload: Record<string, any> = {
            ai_tips: data.summary,
            insta_url: url,
            state,
            country,
        };
        if (imageUrl) updatePayload.image_url = imageUrl;

        const { error } = await supabase
            .from("travel_spots")
            .update(updatePayload)
            .eq("id", existing[0].id);

        return { error, isDuplicate: true, action: "updated" };
    }

    // New entry
    const payload: Record<string, any> = {
        insta_url: url,
        ai_tips: data.summary,
        place_name: placeName,
        city,
        state,
        country,
        user_id: userId,
    };
    if (imageUrl) payload.image_url = imageUrl;

    const { error } = await supabase.from("travel_spots").insert(payload);
    return { error, isDuplicate: false, action: "inserted" };
}

/**
 * IDEAS (Knowledge Base): Insert with tags.
 */
async function insertIdeas(data: any, url: string, userId: string) {
    const { error } = await supabase.from("startup_ideas").insert({
        title: data.title || url,
        description: data.summary,
        tags: data.tags || [],
        user_id: userId,
    });
    return { error };
}

/**
 * MOVIES: Insert with genre, platform, and expanded AI summary.
 */
async function insertMovies(data: any, url: string, userId: string, imageUrl: string) {
    const payload: Record<string, any> = {
        title: data.movie_name || data.summary,
        platform: url,
        movie_name: data.movie_name || null,
        genre: data.genre || null,
        platform_name: data.platform_name || null,
        ai_summary: data.ai_summary || data.summary,
        user_id: userId,
    };
    if (imageUrl) payload.image_url = imageUrl;

    const { error } = await supabase.from("movie_watchlist").insert(payload);
    return { error };
}

/**
 * STOCKS: Insert with sector and market cap.
 */
async function insertStocks(data: any, url: string, userId: string, imageUrl: string) {
    const payload: Record<string, any> = {
        ticker: data.ticker || url,
        notes: data.summary,
        stock_name: data.stock_name || null,
        sector: data.sector || null,
        market_cap: data.market_cap || null,
        user_id: userId,
    };
    if (imageUrl) payload.image_url = imageUrl;

    const { error } = await supabase.from("stock_tracker").insert(payload);
    return { error };
}

// ========================================================
// Main POST Handler
// ========================================================
export async function POST(req: NextRequest) {
    try {
        console.log("--- Starting Analysis Request (Phase 5) ---");

        // Extract authenticated user from cookies
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() {}, // No-op in API route
                },
            }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            console.warn("Unauthorized: No active session found.");
            return NextResponse.json({ success: false, error: "Please log in first." }, { status: 401 });
        }

        console.log("Authenticated user:", user.id);

        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ success: false, error: "No URL provided" }, { status: 200 });
        }

        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is missing!");
            return NextResponse.json({ success: false, error: "Server Configuration Error: Missing API Key" }, { status: 200 });
        }

        // Step 1: Scrape metadata via Microlink (now also grabs image)
        const { text: caption, imageUrl: scrapedImage } = await scrapeMetadata(url);

        // Step 2: Build Phase 5 context-aware prompt with deep field extraction
        const prompt = buildPhase5Prompt(url, caption);

        // Step 3: Call Gemini with model fallback
        let result;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            result = await model.generateContent(prompt);
        } catch (primaryErr: any) {
            console.warn("⚠️ gemini-2.5-flash failed. Falling back to gemini-flash-latest.");
            console.warn("Primary Error:", primaryErr.message);
            const fallback = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            result = await fallback.generateContent(prompt);
        }

        const response = await result.response;
        const text = response.text();

        console.log("=== RAW AI RESPONSE (Phase 5) ===");
        console.log(text);
        console.log("=================================");

        // Step 4: Robust JSON Parsing
        let data: any;
        try {
            let cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanJson = jsonMatch[0];
            data = JSON.parse(cleanJson);
        } catch {
            console.error("JSON parse failed. Raw text was:", text);
            return NextResponse.json({ success: false, error: "Categorization failed (malformed AI response)." }, { status: 200 });
        }

        // Step 5: Schema Validation
        if (!data || typeof data.category !== 'string' || typeof data.summary !== 'string') {
            return NextResponse.json({ success: false, error: "Categorization failed (invalid schema)." }, { status: 200 });
        }

        if (!AGENT_CATEGORIES.includes(data.category)) {
            console.warn(`Unknown category '${data.category}'. Defaulting to 'Ideas'.`);
            data.category = "Ideas";
        }

        // =============================================
        // Phase 5: Smart Insert Router
        // Each agent has its own insert logic with
        // deduplication, versioning, and deep fields.
        // =============================================
        const tableName = CATEGORY_TABLE_MAP[data.category];
        let dbResult: { error: any; [key: string]: any };

        switch (data.category) {
            case 'Food':
                dbResult = await insertFood(data, url, user.id, scrapedImage);
                break;
            case 'Travel':
                dbResult = await insertTravel(data, url, user.id, scrapedImage);
                break;
            case 'Ideas':
                dbResult = await insertIdeas(data, url, user.id);
                break;
            case 'Movies':
                dbResult = await insertMovies(data, url, user.id, scrapedImage);
                break;
            case 'Stocks':
                dbResult = await insertStocks(data, url, user.id, scrapedImage);
                break;
            default:
                dbResult = { error: { message: "Unknown category" } };
        }

        if (dbResult.error) {
            console.error(`Supabase insert into '${tableName}' failed:`, dbResult.error.message);
            return NextResponse.json({
                success: true,
                data,
                saved: false,
                dbError: dbResult.error.message,
            }, { status: 200 });
        }

        // Build enriched response message
        let extraInfo = "";
        if (data.category === "Food" && dbResult.isNewVersion) {
            extraInfo = ` (Version ${dbResult.version} — existing recipe updated!)`;
        }
        if (data.category === "Travel" && dbResult.isDuplicate) {
            extraInfo = " (Duplicate detected — existing entry updated!)";
        }

        console.log(`✅ Saved to Supabase table: ${tableName}${extraInfo}`);

        return NextResponse.json({
            success: true,
            data,
            saved: true,
            table: tableName,
            extraInfo,
        }, { status: 200 });

    } catch (error: any) {
        console.error("=== FATAL SYSTEM ERROR ===");
        console.dir(error, { depth: null });
        return NextResponse.json(
            { success: false, error: "AI Engine Failure: " + (error.message || "Unknown error") },
            { status: 200 }
        );
    }
}