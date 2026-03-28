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

// Table names and their searchable text columns
const TABLE_CONFIG: Record<string, { table: string; textColumns: string[] }> = {
    travel_spots:   { table: "travel_spots",   textColumns: ["ai_tips", "place_name", "city", "state", "country"] },
    recipes:        { table: "recipes",        textColumns: ["dish_name", "instructions"] },
    startup_ideas:  { table: "startup_ideas",  textColumns: ["title", "description"] },
    movie_watchlist:{ table: "movie_watchlist", textColumns: ["title", "movie_name", "genre", "ai_summary", "platform_name"] },
    stock_tracker:  { table: "stock_tracker",  textColumns: ["stock_name", "ticker", "notes", "sector"] },
};

// ========================================================
// POST /api/semantic-search
// Body: { prompt: string, table: string }
// Returns: { matchedIds: number[] }
//
// The Mood Prompt Bar sends the user's mood/prompt. This
// route fetches all the user's items from the specified
// table and asks Gemini to pick the best matching IDs.
// ========================================================
export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll() {},
                },
            }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Please log in first." }, { status: 401 });
        }

        const { prompt, table } = await req.json();

        if (!prompt || !table) {
            return NextResponse.json({ success: false, error: "Missing prompt or table name." }, { status: 400 });
        }

        if (!TABLE_CONFIG[table]) {
            return NextResponse.json({ success: false, error: `Invalid table: ${table}` }, { status: 400 });
        }

        // Fetch all user's items from the specified table
        const { data: items, error: fetchErr } = await supabase
            .from(table)
            .select("*")
            .eq("user_id", user.id);

        if (fetchErr) {
            return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ success: true, matchedIds: [], message: "No items to search through." });
        }

        // Build a compact representation for Gemini
        const config = TABLE_CONFIG[table];
        const itemSummaries = items.map((item: any) => {
            const texts = config.textColumns
                .map(col => item[col])
                .filter(Boolean)
                .join(" | ");
            return `ID:${item.id} → ${texts}`;
        }).join("\n");

        const geminiPrompt = `
You are a semantic search engine for a personal life-hub app called OmniMind.

The user typed this mood/prompt: "${prompt}"

Here are ALL the user's saved items from the "${table}" table:
${itemSummaries}

Your job: Return ONLY the IDs of items that best match the user's mood or query.
- Consider semantic meaning, emotional tone, and contextual relevance — not just keyword matching.
- If the prompt is a mood (e.g., "I'm sad, give me comfort food"), match items that would fulfill that mood.
- If the prompt is a direct query (e.g., "Italian restaurants"), match literally relevant items.
- Return between 0 and ${Math.min(items.length, 20)} IDs. Only return relevant matches.
- If nothing matches, return an empty array.

Return ONLY a JSON array of matching IDs. No markdown, no explanation.
Example: [3, 7, 12]
`;

        // Call Gemini
        let result;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            result = await model.generateContent(geminiPrompt);
        } catch {
            const fallback = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            result = await fallback.generateContent(geminiPrompt);
        }

        const text = result.response.text();
        console.log("Semantic search raw response:", text);

        // Parse the ID array
        let matchedIds: number[] = [];
        try {
            const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                matchedIds = JSON.parse(jsonMatch[0]);
            }
        } catch {
            console.error("Failed to parse semantic search response:", text);
            return NextResponse.json({ success: false, error: "AI returned an invalid response." }, { status: 200 });
        }

        // Validate that returned IDs actually exist in the user's data
        const validIds = new Set(items.map((item: any) => item.id));
        matchedIds = matchedIds.filter(id => validIds.has(id));

        return NextResponse.json({
            success: true,
            matchedIds,
            total: items.length,
            matched: matchedIds.length,
        });

    } catch (error: any) {
        console.error("Semantic search error:", error);
        return NextResponse.json(
            { success: false, error: "Semantic search failed: " + (error.message || "Unknown error") },
            { status: 500 }
        );
    }
}
