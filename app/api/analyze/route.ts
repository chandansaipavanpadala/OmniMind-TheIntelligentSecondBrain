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
async function scrapeInstagramMetadata(url: string): Promise<string> {
    try {
        console.log("Scraper: Querying Microlink API for metadata...");

        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
        const res = await fetch(microlinkUrl);

        if (!res.ok) {
            console.warn(`Scraper: Microlink returned HTTP ${res.status}. Falling back to raw URL.`);
            return "";
        }

        const json = await res.json();

        if (json.status !== "success" || !json.data) {
            console.warn("Scraper: Microlink returned non-success status:", json.status);
            return "";
        }

        const title = json.data.title || "";
        const description = json.data.description || "";
        const combined = `${title} ${description}`.trim();

        if (combined) {
            console.log("Scraper: Microlink extracted metadata successfully.");
            console.log("  Title:", title);
            console.log("  Description:", description);
        } else {
            console.warn("Scraper: Microlink returned empty metadata.");
        }

        return combined;
    } catch (error: any) {
        console.warn("Scraper: Microlink fetch failed:", error.message);
        return ""; // Graceful fallback: the AI will just use the raw URL
    }
}

// ========================================================
// Main POST Handler
// ========================================================
export async function POST(req: NextRequest) {
    try {
        console.log("--- Starting Analysis Request ---");

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

        // Step 1: Scrape metadata via Microlink
        const caption = await scrapeInstagramMetadata(url);

        // Step 2: Build a context-aware prompt
        const contextBlock = caption
            ? `The video's scraped title and caption is: "${caption}"`
            : `No caption could be extracted. Infer the category from the URL structure: ${url}`;

        const prompt = `
      You are a categorization engine for a personal life-hub app.
      An Instagram Reel was submitted with this URL: ${url}
      ${contextBlock}

      IMPORTANT: Pay close attention to hashtags (e.g. #travel, #food, #recipe, #movie, #stocks).
      Hashtags are the strongest signal for categorization. If #travel or #kerala or #wanderlust appears, it is Travel.

      Categorize this reel strictly into one of: ${AGENT_CATEGORIES.join(', ')}.

      Rules:
      - Travel: Destinations, trips, flights, hotels, tourist spots, nature, adventure, wanderlust, explore.
      - Food: Recipes, restaurants, cooking, street food, cafes, baking, foodie.
      - Ideas: Startups, business, productivity, tech, innovation, side hustles.
      - Movies: Films, trailers, reviews, TV shows, actors, cinema, anime, Netflix, series.
      - Stocks: Finance, investing, trading, crypto, markets, economy, mutual funds.

      Return ONLY a JSON object (no markdown, no explanation):
      {
        "category": "category_name",
        "summary": "a short 1-sentence description of what this reel is about"
      }
    `;

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

        console.log("=== RAW AI RESPONSE ===");
        console.log(text);
        console.log("=======================");

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
        // Task 2: Supabase Database Bridge
        // Maps AI output to each table's exact column schema
        // =============================================
        const tableName = CATEGORY_TABLE_MAP[data.category];

        // Build the insert payload based on each table's unique column names
        let insertPayload: Record<string, string> = {};
        switch (data.category) {
            case 'Travel':
                insertPayload = { insta_url: url, ai_tips: data.summary, user_id: user.id };
                break;
            case 'Food':
                insertPayload = { insta_url: url, instructions: data.summary, dish_name: "Imported from Instagram", user_id: user.id };
                break;
            case 'Ideas':
                insertPayload = { description: data.summary, title: url, user_id: user.id };
                break;
            case 'Movies':
                insertPayload = { title: data.summary, platform: url, user_id: user.id };
                break;
            case 'Stocks':
                insertPayload = { notes: data.summary, ticker: url, user_id: user.id };
                break;
        }

        const { error: dbError } = await supabase.from(tableName).insert(insertPayload);

        if (dbError) {
            console.error(`Supabase insert into '${tableName}' failed:`, dbError.message);
            // Still return AI result even if DB insert fails
            return NextResponse.json({
                success: true,
                data,
                saved: false,
                dbError: dbError.message,
            }, { status: 200 });
        }

        console.log(`✅ Saved to Supabase table: ${tableName}`);

        return NextResponse.json({
            success: true,
            data,
            saved: true,
            table: tableName,
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